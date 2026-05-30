import { LocalAuthError, LocalAuthService } from './local-auth.service';

describe('LocalAuthService', () => {
  let service: LocalAuthService;
  const baseNow = new Date('2026-05-30T12:00:00.000Z');

  beforeEach(() => {
    service = new LocalAuthService();
  });

  it('creates an invitation and starts local access with a safe audit context', () => {
    const created = service.createInvitation(
      {
        email: 'Invited.User@Example.test',
        displayName: 'Invited User',
        role: 'viewer',
      },
      baseNow,
    );

    expect(created.invitation).toMatchObject({
      email: 'invited.user@example.test',
      status: 'pending',
    });
    expect(created.inviteToken).toMatch(/^inv_/);
    expect(created.delivery.invitePath).toBe(`/convite/${created.inviteToken}`);
    expect(JSON.stringify(created.safeAudit)).not.toMatch(/token|password|secret|inv_/i);

    const started = service.startInvitationByToken(created.inviteToken, baseNow);

    expect(started.nextStep).toBe('define_initial_password');
    expect(started.user.email).toBe('invited.user@example.test');
    expect(JSON.stringify(started)).not.toContain(created.inviteToken);
  });

  it('blocks expired and invalid invitation tokens', () => {
    const created = service.createInvitation(
      {
        email: 'expired@example.test',
        ttlMinutes: 10,
      },
      baseNow,
    );

    const afterExpiry = new Date('2026-05-30T12:11:00.000Z');

    expect(() => service.startInvitationByToken(created.inviteToken, afterExpiry)).toThrow(
      LocalAuthError,
    );
    expect(() => service.startInvitationByToken('inv_invalid', baseNow)).toThrow(LocalAuthError);
    expect(service.getInvitation(created.invitation.id, afterExpiry).status).toBe('expired');
  });

  it('invalidates invitations and prevents reuse of the local access flow', () => {
    const created = service.createInvitation(
      {
        email: 'invalidated@example.test',
      },
      baseNow,
    );

    const invalidated = service.invalidateInvitation(created.invitation.id, baseNow);

    expect(invalidated.status).toBe('invalidated');
    expect(() => service.startInvitationByToken(created.inviteToken, baseNow)).toThrow(
      LocalAuthError,
    );
  });

  it('accepts an invitation, stores only a password hash and creates a local session', () => {
    const created = service.createInvitation(
      {
        email: 'new-user@example.test',
        displayName: 'New User',
      },
      baseNow,
    );
    const passphrase = 'SenhaInicial123';

    const accepted = service.acceptInvitation(
      {
        inviteToken: created.inviteToken,
        password: passphrase,
      },
      baseNow,
    );

    expect(accepted.user).toMatchObject({
      email: 'new-user@example.test',
      status: 'active',
    });
    expect(accepted.nextStep).toBe('authenticated');
    expect(accepted.session.status).toBe('active');
    expect(service.validateSessionByToken(accepted.sessionToken, baseNow).valid).toBe(true);
    expect(service.getInvitation(created.invitation.id, baseNow).status).toBe('accepted');
    expect(JSON.stringify(accepted)).not.toContain(passphrase);
    expect(JSON.stringify(accepted.safeAudit)).not.toMatch(/token|password|secret|SenhaInicial/i);
  });

  it('rejects reused, expired and invalid invitation acceptance with generic safe errors', () => {
    const reusable = service.createInvitation({ email: 'used@example.test' }, baseNow);
    service.acceptInvitation(
      {
        inviteToken: reusable.inviteToken,
        password: 'SenhaInicial123',
      },
      baseNow,
    );

    expect(() =>
      service.acceptInvitation(
        {
          inviteToken: reusable.inviteToken,
          password: 'OutraSenha123',
        },
        baseNow,
      ),
    ).toThrow(LocalAuthError);

    const expired = service.createInvitation(
      {
        email: 'accept-expired@example.test',
        ttlMinutes: 1,
      },
      baseNow,
    );
    expect(() =>
      service.acceptInvitation(
        {
          inviteToken: expired.inviteToken,
          password: 'SenhaInicial123',
        },
        new Date('2026-05-30T12:02:00.000Z'),
      ),
    ).toThrow(LocalAuthError);

    expect(() =>
      service.acceptInvitation(
        {
          inviteToken: 'inv_invalid',
          password: 'SenhaInicial123',
        },
        baseNow,
      ),
    ).toThrow(LocalAuthError);
  });

  it('enforces the V1 minimum password policy before accepting an invitation', () => {
    const created = service.createInvitation({ email: 'weak-password@example.test' }, baseNow);

    expect(() =>
      service.acceptInvitation(
        {
          inviteToken: created.inviteToken,
          password: 'curta',
        },
        baseNow,
      ),
    ).toThrow(LocalAuthError);
    expect(service.getInvitation(created.invitation.id, baseNow).status).toBe('pending');
  });

  it('logs in active local users without revealing whether credentials failed by email or password', () => {
    const created = service.createInvitation({ email: 'login@example.test' }, baseNow);
    service.acceptInvitation(
      {
        inviteToken: created.inviteToken,
        password: 'SenhaInicial123',
      },
      baseNow,
    );

    const login = service.loginLocal(
      {
        email: 'LOGIN@example.test',
        password: 'SenhaInicial123',
      },
      baseNow,
    );

    expect(login.user.email).toBe('login@example.test');
    expect(login.session.status).toBe('active');
    expect(JSON.stringify(login)).not.toContain('SenhaInicial123');

    const wrongPassword = captureAuthError(() =>
      service.loginLocal({ email: 'login@example.test', password: 'SenhaErrada123' }, baseNow),
    );
    const unknownEmail = captureAuthError(() =>
      service.loginLocal({ email: 'missing@example.test', password: 'SenhaErrada123' }, baseNow),
    );

    expect(wrongPassword.code).toBe('LOGIN_DENIED');
    expect(unknownEmail.code).toBe('LOGIN_DENIED');
    expect(wrongPassword.message).toBe(unknownEmail.message);
    expect(JSON.stringify(wrongPassword.safeAudit)).not.toMatch(/SenhaErrada|password|secret/i);
  });

  it('creates, validates and revokes local sessions for active users', () => {
    const user = service.createLocalUser(
      {
        email: 'active@example.test',
        displayName: 'Active User',
        role: 'administrator',
        status: 'active',
      },
      baseNow,
    );

    const created = service.createSession(
      {
        userId: user.id,
        ttlMinutes: 30,
      },
      baseNow,
    );

    expect(created.session.status).toBe('active');
    expect(created.sessionToken).toMatch(/^sess_/);
    expect(service.validateSessionByToken(created.sessionToken, baseNow).valid).toBe(true);
    expect(JSON.stringify(created.safeAudit)).not.toMatch(/token|password|secret|sess_/i);

    const revoked = service.endSession(created.session.id, baseNow);

    expect(revoked.status).toBe('revoked');
    expect(service.validateSessionByToken(created.sessionToken, baseNow).valid).toBe(false);
  });

  it('ends local sessions by token without returning the token', () => {
    const user = service.createLocalUser(
      {
        email: 'logout@example.test',
        displayName: 'Logout User',
        role: 'viewer',
        status: 'active',
      },
      baseNow,
    );
    const created = service.createSession({ userId: user.id }, baseNow);

    const ended = service.endSessionByToken(created.sessionToken, baseNow);

    expect(ended.status).toBe('revoked');
    expect(JSON.stringify(ended)).not.toContain(created.sessionToken);
  });

  it('expires local sessions without exposing the session token in validation responses', () => {
    const user = service.createLocalUser(
      {
        email: 'short-session@example.test',
        displayName: 'Short Session',
        role: 'editor',
        status: 'active',
      },
      baseNow,
    );
    const created = service.createSession({ userId: user.id, ttlMinutes: 1 }, baseNow);
    const afterExpiry = new Date('2026-05-30T12:02:00.000Z');
    const validation = service.validateSessionByToken(created.sessionToken, afterExpiry);

    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe('expired');
    expect(JSON.stringify(validation)).not.toContain(created.sessionToken);
    expect(service.getSession(created.session.id, afterExpiry).status).toBe('expired');
  });

  it('does not create sessions for invited, suspended or unknown users', () => {
    const invited = service.createLocalUser(
      {
        email: 'pending@example.test',
        displayName: 'Pending User',
        role: 'viewer',
        status: 'invited',
      },
      baseNow,
    );

    expect(() => service.createSession({ userId: invited.id }, baseNow)).toThrow(LocalAuthError);
    expect(() => service.createSession({ userId: 'unknown-user' }, baseNow)).toThrow(
      LocalAuthError,
    );
  });
});

function captureAuthError(action: () => unknown): LocalAuthError {
  try {
    action();
  } catch (error) {
    if (error instanceof LocalAuthError) {
      return error;
    }
  }

  throw new Error('Expected LocalAuthError');
}
