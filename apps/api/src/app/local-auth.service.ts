import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type {
  CreateLocalInvitationResponse,
  CreateLocalSessionResponse,
  LocalAuthAuditContext,
  LocalInvitationStartResponse,
  LocalInvitationStatus,
  LocalInvitationView,
  LocalSessionStatus,
  LocalSessionValidationResponse,
  LocalSessionView,
  LocalUserStatus,
  LocalUserView,
  UserRole,
} from '@heimdall/contracts';

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
  | 'SESSION_NOT_FOUND';

interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: LocalUserStatus;
  createdAt: Date;
  activatedAt?: Date;
}

interface StoredInvitation {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  status: Exclude<LocalInvitationStatus, 'expired'>;
  createdAt: Date;
  expiresAt: Date;
  invalidatedAt?: Date;
  acceptedAt?: Date;
}

interface StoredSession {
  id: string;
  userId: string;
  sessionTokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
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

export class LocalAuthError extends Error {
  constructor(
    readonly code: LocalAuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'LocalAuthError';
  }
}

function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function createOpaqueToken(prefix: string): string {
  return `${prefix}_${randomBytes(32).toString('base64url')}`;
}

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new LocalAuthError('INVALID_EMAIL', 'E-mail invalido.');
  }

  return normalized;
}

function positiveTtl(input: number | undefined, fallback: number): number {
  if (input === undefined) {
    return fallback;
  }

  if (!Number.isInteger(input) || input <= 0) {
    return fallback;
  }

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
  return {
    action,
    result,
    occurredAt: now.toISOString(),
    ...details,
  };
}

@Injectable()
export class LocalAuthService {
  private readonly users = new Map<string, StoredUser>();
  private readonly usersByEmail = new Map<string, string>();
  private readonly invitations = new Map<string, StoredInvitation>();
  private readonly invitationByTokenHash = new Map<string, string>();
  private readonly sessions = new Map<string, StoredSession>();
  private readonly sessionByTokenHash = new Map<string, string>();

  createLocalUser(input: CreateLocalUserInput, now = new Date()): LocalUserView {
    const email = normalizeEmail(input.email);
    const role = this.normalizeRole(input.role);
    const existingId = this.usersByEmail.get(email);

    if (existingId) {
      return this.toUserView(this.users.get(existingId) as StoredUser);
    }

    const status = input.status ?? 'invited';
    const user: StoredUser = {
      id: randomUUID(),
      email,
      displayName: input.displayName?.trim() || email.split('@')[0],
      role,
      status,
      createdAt: now,
      activatedAt: status === 'active' ? now : undefined,
    };

    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);

    return this.toUserView(user);
  }

  createInvitation(input: CreateInvitationInput, now = new Date()): CreateInvitationResult {
    const user = this.ensureInvitedUser(input, now);
    const inviteToken = createOpaqueToken(INVITE_PREFIX);
    const expiresAt = addMinutes(now, positiveTtl(input.ttlMinutes, DEFAULT_INVITE_TTL_MINUTES));
    const invitation: StoredInvitation = {
      id: randomUUID(),
      userId: user.id,
      email: user.email,
      tokenHash: hashSecret(inviteToken),
      status: 'pending',
      createdAt: now,
      expiresAt,
    };

    this.invitations.set(invitation.id, invitation);
    this.invitationByTokenHash.set(invitation.tokenHash, invitation.id);

    return {
      invitation: this.toInvitationView(invitation, now),
      inviteToken,
      delivery: {
        mode: 'manual',
        invitePath: `/convite/${inviteToken}`,
        expiresAt: expiresAt.toISOString(),
      },
      safeAudit: audit('local_invitation_created', 'success', now, {
        userId: user.id,
        invitationId: invitation.id,
      }),
    };
  }

  getInvitation(invitationId: string, now = new Date()): LocalInvitationView {
    const invitation = this.invitations.get(invitationId);

    if (!invitation) {
      throw new LocalAuthError('INVITATION_NOT_FOUND', 'Convite nao encontrado.');
    }

    return this.toInvitationView(invitation, now);
  }

  startInvitationByToken(token: string, now = new Date()): StartInvitationResult {
    const invitation = this.findUsableInvitationByToken(token, now);
    const user = this.users.get(invitation.userId);

    if (!user) {
      throw new LocalAuthError('USER_NOT_FOUND', 'Usuario nao encontrado.');
    }

    return {
      invitation: this.toInvitationView(invitation, now),
      user: this.toUserView(user),
      nextStep: 'define_initial_password',
      safeAudit: audit('local_invitation_started', 'success', now, {
        userId: user.id,
        invitationId: invitation.id,
      }),
    };
  }

  invalidateInvitation(invitationId: string, now = new Date()): LocalInvitationView {
    const invitation = this.invitations.get(invitationId);

    if (!invitation) {
      throw new LocalAuthError('INVITATION_NOT_FOUND', 'Convite nao encontrado.');
    }

    if (invitation.status === 'pending') {
      invitation.status = 'invalidated';
      invitation.invalidatedAt = now;
    }

    return this.toInvitationView(invitation, now);
  }

  createSession(input: CreateSessionInput, now = new Date()): CreateSessionResult {
    const user = this.users.get(input.userId);

    if (!user || user.status !== 'active') {
      throw new LocalAuthError('SESSION_NOT_ALLOWED', 'Sessao local nao permitida.');
    }

    const sessionToken = createOpaqueToken(SESSION_PREFIX);
    const expiresAt = addMinutes(now, positiveTtl(input.ttlMinutes, DEFAULT_SESSION_TTL_MINUTES));
    const session: StoredSession = {
      id: randomUUID(),
      userId: user.id,
      sessionTokenHash: hashSecret(sessionToken),
      createdAt: now,
      expiresAt,
    };

    this.sessions.set(session.id, session);
    this.sessionByTokenHash.set(session.sessionTokenHash, session.id);

    return {
      session: this.toSessionView(session, now),
      sessionToken,
      safeAudit: audit('local_session_created', 'success', now, {
        userId: user.id,
        sessionId: session.id,
      }),
    };
  }

  getSession(sessionId: string, now = new Date()): LocalSessionView {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new LocalAuthError('SESSION_NOT_FOUND', 'Sessao nao encontrada.');
    }

    return this.toSessionView(session, now);
  }

  validateSessionByToken(token: string, now = new Date()): LocalSessionValidationResponse {
    const sessionId = this.sessionByTokenHash.get(hashSecret(token));

    if (!sessionId) {
      return {
        valid: false,
        reason: 'missing',
      };
    }

    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        valid: false,
        reason: 'missing',
      };
    }

    const status = this.sessionStatus(session, now);

    if (status !== 'active') {
      return {
        valid: false,
        reason: status,
        session: this.toSessionView(session, now),
      };
    }

    return {
      valid: true,
      session: this.toSessionView(session, now),
    };
  }

  endSession(sessionId: string, now = new Date()): EndSessionResult {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new LocalAuthError('SESSION_NOT_FOUND', 'Sessao nao encontrada.');
    }

    if (!session.revokedAt) {
      session.revokedAt = now;
    }

    return {
      ...this.toSessionView(session, now),
      safeAudit: audit('local_session_revoked', 'success', now, {
        userId: session.userId,
        sessionId: session.id,
      }),
    };
  }

  endSessionByToken(token: string, now = new Date()): EndSessionResult {
    const sessionId = this.sessionByTokenHash.get(hashSecret(token));

    if (!sessionId) {
      throw new LocalAuthError('SESSION_NOT_FOUND', 'Sessao nao encontrada.');
    }

    return this.endSession(sessionId, now);
  }

  private ensureInvitedUser(input: CreateInvitationInput, now: Date): StoredUser {
    const email = normalizeEmail(input.email);
    const role = this.normalizeRole(input.role);
    const existingId = this.usersByEmail.get(email);

    if (existingId) {
      const existing = this.users.get(existingId) as StoredUser;

      if (existing.status !== 'invited') {
        throw new LocalAuthError('USER_NOT_INVITABLE', 'Usuario local nao pode receber convite.');
      }

      return existing;
    }

    const userView = this.createLocalUser(
      {
        email,
        displayName: input.displayName,
        role,
        status: 'invited',
      },
      now,
    );

    return this.users.get(userView.id) as StoredUser;
  }

  private findUsableInvitationByToken(token: string, now: Date): StoredInvitation {
    const invitationId = this.invitationByTokenHash.get(hashSecret(token));
    const invitation = invitationId ? this.invitations.get(invitationId) : undefined;

    if (!invitation) {
      throw new LocalAuthError('INVITATION_NOT_USABLE', 'Convite invalido ou expirado.');
    }

    if (this.invitationStatus(invitation, now) !== 'pending') {
      throw new LocalAuthError('INVITATION_NOT_USABLE', 'Convite invalido ou expirado.');
    }

    return invitation;
  }

  private normalizeRole(role: UserRole | undefined): UserRole {
    const normalized = role ?? 'viewer';

    if (!VALID_ROLES.has(normalized)) {
      throw new LocalAuthError('INVALID_ROLE', 'Perfil invalido.');
    }

    return normalized;
  }

  private invitationStatus(invitation: StoredInvitation, now: Date): LocalInvitationStatus {
    if (invitation.status !== 'pending') {
      return invitation.status;
    }

    return invitation.expiresAt.getTime() <= now.getTime() ? 'expired' : 'pending';
  }

  private sessionStatus(session: StoredSession, now: Date): LocalSessionStatus {
    if (session.revokedAt) {
      return 'revoked';
    }

    return session.expiresAt.getTime() <= now.getTime() ? 'expired' : 'active';
  }

  private toUserView(user: StoredUser): LocalUserView {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      activatedAt: user.activatedAt?.toISOString(),
    };
  }

  private toInvitationView(invitation: StoredInvitation, now: Date): LocalInvitationView {
    return {
      id: invitation.id,
      userId: invitation.userId,
      email: invitation.email,
      status: this.invitationStatus(invitation, now),
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt.toISOString(),
      invalidatedAt: invitation.invalidatedAt?.toISOString(),
      acceptedAt: invitation.acceptedAt?.toISOString(),
    };
  }

  private toSessionView(session: StoredSession, now: Date): LocalSessionView {
    return {
      id: session.id,
      userId: session.userId,
      status: this.sessionStatus(session, now),
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      revokedAt: session.revokedAt?.toISOString(),
    };
  }
}
