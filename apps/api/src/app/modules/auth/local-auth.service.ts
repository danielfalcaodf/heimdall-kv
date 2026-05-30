import { Injectable } from '@nestjs/common';
import type {
  AcceptLocalInvitationResponse,
  CreateLocalInvitationResponse,
  CreateLocalSessionResponse,
  LocalLoginResponse,
  LocalAuthAuditContext,
  LocalInvitationStartResponse,
  LocalInvitationView,
  LocalSessionValidationResponse,
  LocalSessionView,
  LocalUserStatus,
  LocalUserView,
  UserRole,
} from '@heimdall/contracts';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { UserRepository } from './repositories/user.repository';
import { InvitationRepository } from './repositories/invitation.repository';
import { SessionRepository } from './repositories/session.repository';

const DEFAULT_INVITE_TTL_MINUTES = 7 * 24 * 60;
const DEFAULT_SESSION_TTL_MINUTES = 8 * 60;
const INVITE_PREFIX = 'inv';
const SESSION_PREFIX = 'sess';
const VALID_ROLES = new Set<UserRole>(['viewer', 'editor', 'administrator', 'vault']);

type LocalAuthErrorCode =
  | 'INVALID_EMAIL'
  | 'INVALID_ROLE'
  | 'USER_NOT_INVITABLE'
  | 'INVITATION_NOT_FOUND'
  | 'INVITATION_NOT_USABLE'
  | 'USER_NOT_FOUND'
  | 'SESSION_NOT_ALLOWED'
  | 'SESSION_NOT_FOUND'
  | 'PASSWORD_POLICY_FAILED'
  | 'LOGIN_DENIED';

export class LocalAuthError extends Error {
  constructor(
    readonly code: LocalAuthErrorCode,
    message: string,
    readonly safeAudit?: LocalAuthAuditContext,
  ) {
    super(message);
    this.name = 'LocalAuthError';
  }
}

export interface CreateLocalUserInput {
  email: string;
  displayName?: string;
  role?: UserRole;
  status?: LocalUserStatus;
}

export interface CreateInvitationInput {
  email: string;
  displayName?: string;
  role?: UserRole;
  ttlMinutes?: number;
}

export interface CreateInvitationResult extends CreateLocalInvitationResponse {
  inviteToken: string;
  safeAudit: LocalAuthAuditContext;
}

export interface StartInvitationResult extends LocalInvitationStartResponse {
  safeAudit: LocalAuthAuditContext;
}

export interface AcceptInvitationInput {
  inviteToken: string;
  password: string;
}

export interface AcceptInvitationResult extends AcceptLocalInvitationResponse {
  safeAudit: LocalAuthAuditContext;
}

export interface LoginLocalInput {
  email: string;
  password: string;
}

export interface LoginLocalResult extends LocalLoginResponse {
  safeAudit: LocalAuthAuditContext;
}

export interface CreateSessionInput {
  userId: string;
  ttlMinutes?: number;
}

export interface CreateSessionResult extends CreateLocalSessionResponse {
  safeAudit: LocalAuthAuditContext;
}

export interface EndSessionResult extends LocalSessionView {
  safeAudit: LocalAuthAuditContext;
}

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new LocalAuthError('INVALID_EMAIL', 'E-mail invalido.');
  }
  return normalized;
}

function positiveTtl(input: number | undefined, fallback: number): number {
  if (input === undefined || !Number.isInteger(input) || input <= 0) return fallback;
  return input;
}

function addMinutes(now: Date, minutes: number): Date {
  return new Date(now.getTime() + minutes * 60_000);
}

function audit(
  action: LocalAuthAuditContext['action'],
  result: LocalAuthAuditContext['result'],
  now: Date,
  details: Omit<LocalAuthAuditContext, 'action' | 'result' | 'occurredAt'> = {},
): LocalAuthAuditContext {
  return { action, result, occurredAt: now.toISOString(), ...details };
}

@Injectable()
export class LocalAuthService {
  private readonly password: PasswordService;
  private readonly token: TokenService;
  private readonly userRepo: UserRepository;
  private readonly invitationRepo: InvitationRepository;
  private readonly sessionRepo: SessionRepository;

  constructor(
    password?: PasswordService,
    token?: TokenService,
    userRepo?: UserRepository,
    invitationRepo?: InvitationRepository,
    sessionRepo?: SessionRepository,
  ) {
    this.password = password ?? new PasswordService();
    this.token = token ?? new TokenService();
    this.userRepo = userRepo ?? new UserRepository();
    this.invitationRepo = invitationRepo ?? new InvitationRepository();
    this.sessionRepo = sessionRepo ?? new SessionRepository();
  }

  private normalizeRole(role: UserRole | undefined): UserRole {
    const normalized = role ?? 'viewer';
    if (!VALID_ROLES.has(normalized)) {
      throw new LocalAuthError('INVALID_ROLE', 'Perfil invalido.');
    }
    return normalized;
  }

  createLocalUser(input: CreateLocalUserInput, now = new Date()): LocalUserView {
    const email = normalizeEmail(input.email);
    const role = this.normalizeRole(input.role);
    const existing = this.userRepo.findByEmail(email);
    if (existing) return this.userRepo.toView(existing);

    const user = this.userRepo.create({ email, displayName: input.displayName, role, status: input.status ?? 'invited', now });
    return this.userRepo.toView(user);
  }

  createInvitation(input: CreateInvitationInput, now = new Date()): CreateInvitationResult {
    const email = normalizeEmail(input.email);
    const role = this.normalizeRole(input.role);
    const existing = this.userRepo.findByEmail(email);

    let user = existing;
    if (!user) {
      user = this.userRepo.create({ email, displayName: input.displayName, role, status: 'invited', now });
    } else if (user.status !== 'invited') {
      throw new LocalAuthError('USER_NOT_INVITABLE', 'Usuario local nao pode receber convite.');
    }

    const inviteToken = this.token.createOpaque(INVITE_PREFIX);
    const tokenHash = this.password.hashSecret(inviteToken);
    const expiresAt = addMinutes(now, positiveTtl(input.ttlMinutes, DEFAULT_INVITE_TTL_MINUTES));
    const invitation = this.invitationRepo.create({ userId: user.id, email: user.email, tokenHash, expiresAt, now });

    return {
      invitation: this.invitationRepo.toView(invitation, now),
      inviteToken,
      delivery: {
        mode: 'manual',
        invitePath: `/convite/${inviteToken}`,
        expiresAt: expiresAt.toISOString(),
      },
      safeAudit: audit('local_invitation_created', 'success', now, { userId: user.id, invitationId: invitation.id }),
    };
  }

  getInvitation(invitationId: string, now = new Date()): LocalInvitationView {
    const invitation = this.invitationRepo.findById(invitationId);
    if (!invitation) throw new LocalAuthError('INVITATION_NOT_FOUND', 'Convite nao encontrado.');
    return this.invitationRepo.toView(invitation, now);
  }

  startInvitationByToken(token: string, now = new Date()): StartInvitationResult {
    const tokenHash = this.password.hashSecret(token);
    const invitation = this.invitationRepo.findByTokenHash(tokenHash);

    if (!invitation || this.invitationRepo.statusOf(invitation, now) !== 'pending') {
      throw new LocalAuthError('INVITATION_NOT_USABLE', 'Convite invalido ou expirado.');
    }

    const user = this.userRepo.findById(invitation.userId);
    if (!user) throw new LocalAuthError('USER_NOT_FOUND', 'Usuario nao encontrado.');

    return {
      invitation: this.invitationRepo.toView(invitation, now),
      user: this.userRepo.toView(user),
      nextStep: 'define_initial_password',
      safeAudit: audit('local_invitation_started', 'success', now, { userId: user.id, invitationId: invitation.id }),
    };
  }

  invalidateInvitation(invitationId: string, now = new Date()): LocalInvitationView {
    const invitation = this.invitationRepo.findById(invitationId);
    if (!invitation) throw new LocalAuthError('INVITATION_NOT_FOUND', 'Convite nao encontrado.');

    if (invitation.status === 'pending') {
      invitation.status = 'invalidated';
      invitation.invalidatedAt = now;
    }

    return this.invitationRepo.toView(invitation, now);
  }

  acceptInvitation(input: AcceptInvitationInput, now = new Date()): AcceptInvitationResult {
    const tokenHash = this.password.hashSecret(input.inviteToken);
    const invitation = this.invitationRepo.findByTokenHash(tokenHash);

    if (!invitation || this.invitationRepo.statusOf(invitation, now) !== 'pending') {
      throw new LocalAuthError('INVITATION_NOT_USABLE', 'Convite invalido ou expirado.');
    }

    const user = this.userRepo.findById(invitation.userId);
    if (!user) {
      throw new LocalAuthError(
        'USER_NOT_FOUND',
        'Solicitacao invalida.',
        audit('local_invitation_accept_failed', 'denied', now, { invitationId: invitation.id, reason: 'missing_user' }),
      );
    }

    try {
      this.password.assertPolicy(input.password);
    } catch {
      throw new LocalAuthError(
        'PASSWORD_POLICY_FAILED',
        'Senha nao atende a politica minima.',
        audit('local_invitation_accept_failed', 'denied', now, { userId: user.id, invitationId: invitation.id, reason: 'password_policy' }),
      );
    }

    user.passwordHash = this.password.hash(input.password);
    user.passwordSetAt = now;
    user.status = 'active';
    user.activatedAt = user.activatedAt ?? now;
    invitation.status = 'accepted';
    invitation.acceptedAt = now;

    const createdSession = this.createSession({ userId: user.id }, now);

    return {
      user: this.userRepo.toView(user),
      session: createdSession.session,
      sessionToken: createdSession.sessionToken,
      nextStep: 'authenticated',
      safeAudit: audit('local_invitation_accepted', 'success', now, { userId: user.id, invitationId: invitation.id, sessionId: createdSession.session.id }),
    };
  }

  loginLocal(input: LoginLocalInput, now = new Date()): LoginLocalResult {
    const denied = () =>
      new LocalAuthError('LOGIN_DENIED', 'Credenciais invalidas.', audit('local_login_failed', 'denied', now, { reason: 'invalid_credentials' }));

    let email: string;
    try {
      email = normalizeEmail(input.email);
    } catch {
      throw denied();
    }

    const user = this.userRepo.findByEmail(email);
    if (!user || user.status !== 'active' || !this.password.verify(input.password, user.passwordHash)) {
      throw denied();
    }

    const createdSession = this.createSession({ userId: user.id }, now);

    return {
      user: this.userRepo.toView(user),
      session: createdSession.session,
      sessionToken: createdSession.sessionToken,
      safeAudit: audit('local_login_succeeded', 'success', now, { userId: user.id, sessionId: createdSession.session.id }),
    };
  }

  createSession(input: CreateSessionInput, now = new Date()): CreateSessionResult {
    const user = this.userRepo.findById(input.userId);
    if (!user || user.status !== 'active') {
      throw new LocalAuthError('SESSION_NOT_ALLOWED', 'Sessao local nao permitida.');
    }

    const sessionToken = this.token.createOpaque(SESSION_PREFIX);
    const sessionTokenHash = this.password.hashSecret(sessionToken);
    const expiresAt = addMinutes(now, positiveTtl(input.ttlMinutes, DEFAULT_SESSION_TTL_MINUTES));
    const session = this.sessionRepo.create({ userId: user.id, sessionTokenHash, expiresAt, now });

    return {
      session: this.sessionRepo.toView(session, now),
      sessionToken,
      safeAudit: audit('local_session_created', 'success', now, { userId: user.id, sessionId: session.id }),
    };
  }

  getSession(sessionId: string, now = new Date()): LocalSessionView {
    const session = this.sessionRepo.findById(sessionId);
    if (!session) throw new LocalAuthError('SESSION_NOT_FOUND', 'Sessao nao encontrada.');
    return this.sessionRepo.toView(session, now);
  }

  validateSessionByToken(token: string, now = new Date()): LocalSessionValidationResponse {
    const tokenHash = this.password.hashSecret(token);
    const session = this.sessionRepo.findByTokenHash(tokenHash);

    if (!session) return { valid: false, reason: 'missing' };

    const status = this.sessionRepo.statusOf(session, now);
    if (status !== 'active') {
      return { valid: false, reason: status, session: this.sessionRepo.toView(session, now) };
    }

    return { valid: true, session: this.sessionRepo.toView(session, now) };
  }

  endSession(sessionId: string, now = new Date()): EndSessionResult {
    const session = this.sessionRepo.findById(sessionId);
    if (!session) throw new LocalAuthError('SESSION_NOT_FOUND', 'Sessao nao encontrada.');

    if (!session.revokedAt) session.revokedAt = now;

    return {
      ...this.sessionRepo.toView(session, now),
      safeAudit: audit('local_session_revoked', 'success', now, { userId: session.userId, sessionId: session.id }),
    };
  }

  endSessionByToken(token: string, now = new Date()): EndSessionResult {
    const tokenHash = this.password.hashSecret(token);
    const session = this.sessionRepo.findByTokenHash(tokenHash);
    if (!session) throw new LocalAuthError('SESSION_NOT_FOUND', 'Sessao nao encontrada.');
    return this.endSession(session.id, now);
  }
}
