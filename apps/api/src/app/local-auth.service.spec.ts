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
