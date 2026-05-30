import { UserProfileService, UserProfileError } from './user-profile.service';

describe('UserProfileService', () => {
  let service: UserProfileService;
  const now = new Date('2026-05-31T11:00:00.000Z');
  const userId = 'user-abc-123';
  const projectId = 'proj-xyz-456';

  beforeEach(() => {
    service = new UserProfileService();
  });

  // --- Profiles ---

  describe('profiles', () => {
    it('creates a user profile', () => {
      const profile = service.createProfile({ userId, role: 'editor' }, now);
      expect(profile.userId).toBe(userId);
      expect(profile.role).toBe('editor');
      expect(profile.status).toBe('active');
    });

    it('rejects duplicate profile for same user', () => {
      service.createProfile({ userId, role: 'viewer' }, now);
      expect(() => service.createProfile({ userId, role: 'editor' }, now)).toThrow(
        UserProfileError,
      );
    });

    it('suspends an active profile', () => {
      const profile = service.createProfile({ userId, role: 'viewer' }, now);
      const suspended = service.suspendProfile(profile.id, now);
      expect(suspended.status).toBe('suspended');
    });

    it('reactivates a suspended profile', () => {
      const profile = service.createProfile({ userId, role: 'viewer' }, now);
      service.suspendProfile(profile.id, now);
      const reactivated = service.reactivateProfile(profile.id);
      expect(reactivated.status).toBe('active');
    });

    it('suspended profile does not appear in active listing', () => {
      const profile = service.createProfile({ userId, role: 'viewer' }, now);
      service.suspendProfile(profile.id, now);
      expect(service.listProfiles()).toHaveLength(0);
      expect(service.listProfiles({ includeSuspended: true })).toHaveLength(1);
    });

    it('throws when suspending non-existent profile', () => {
      expect(() => service.suspendProfile('missing', now)).toThrow(UserProfileError);
    });
  });

  // --- Bindings ---

  describe('bindings', () => {
    it('creates a user binding to a project', () => {
      const binding = service.createBinding(
        { userId, role: 'viewer', projectId },
        now,
      );
      expect(binding.userId).toBe(userId);
      expect(binding.projectId).toBe(projectId);
      expect(binding.hasVaultAccess).toBe(false);
    });

    it('creates a binding with vault access', () => {
      const binding = service.createBinding(
        { userId, role: 'editor', projectId, hasVaultAccess: true },
        now,
      );
      expect(binding.hasVaultAccess).toBe(true);
    });

    it('lists bindings for a user', () => {
      service.createBinding({ userId, role: 'viewer', projectId: 'p1' }, now);
      service.createBinding({ userId, role: 'viewer', projectId: 'p2' }, now);
      expect(service.listBindingsByUser(userId)).toHaveLength(2);
    });

    it('lists bindings for a project', () => {
      service.createBinding({ userId: 'u1', role: 'viewer', projectId }, now);
      service.createBinding({ userId: 'u2', role: 'editor', projectId }, now);
      service.createBinding({ userId: 'u3', role: 'viewer', projectId: 'other' }, now);
      expect(service.listBindingsByProject(projectId)).toHaveLength(2);
    });

    it('lists all active bindings', () => {
      service.createBinding({ userId: 'u1', role: 'viewer', projectId: 'p1' }, now);
      service.createBinding({ userId: 'u2', role: 'editor', projectId: 'p2' }, now);
      expect(service.listBindings()).toHaveLength(2);
    });

    it('revokes a binding', () => {
      const binding = service.createBinding({ userId, role: 'viewer', projectId }, now);
      service.revokeBinding(binding.id, now);
      expect(service.listBindingsByUser(userId)).toHaveLength(0);
    });

    it('throws when revoking non-existent binding', () => {
      expect(() => service.revokeBinding('missing', now)).toThrow(UserProfileError);
    });
  });
});
