import { Injectable } from '@nestjs/common';
import type {
  CreateOrgUserBindingInput,
  CreateOrgUserProfileInput,
  OrgUserBindingView,
  OrgUserProfileView,
} from '@heimdall/contracts';
import {
  UserProfileRepository,
  StoredUserProfile,
} from './repositories/user-profile.repository';
import {
  UserBindingRepository,
  StoredUserBinding,
} from './repositories/user-binding.repository';

type UserProfileErrorCode =
  | 'PROFILE_ALREADY_EXISTS'
  | 'PROFILE_NOT_FOUND'
  | 'BINDING_NOT_FOUND';

export class UserProfileError extends Error {
  constructor(
    readonly code: UserProfileErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'UserProfileError';
  }
}

export interface ListProfilesOptions {
  includeSuspended?: boolean;
}

@Injectable()
export class UserProfileService {
  private readonly profiles: UserProfileRepository;
  private readonly bindings: UserBindingRepository;

  constructor(
    profiles?: UserProfileRepository,
    bindings?: UserBindingRepository,
  ) {
    this.profiles = profiles ?? new UserProfileRepository();
    this.bindings = bindings ?? new UserBindingRepository();
  }

  // --- Profiles ---

  createProfile(input: CreateOrgUserProfileInput, now: Date): OrgUserProfileView {
    const existing = this.profiles.findByUserId(input.userId);
    if (existing) {
      throw new UserProfileError(
        'PROFILE_ALREADY_EXISTS',
        `User "${input.userId}" already has a profile.`,
      );
    }
    const profile = this.profiles.create(input.userId, input.role, now);
    return this.toProfileView(profile);
  }

  listProfiles(options: ListProfilesOptions = {}): OrgUserProfileView[] {
    return this.profiles.findAll(options.includeSuspended).map((p) => this.toProfileView(p));
  }

  suspendProfile(id: string, now: Date): OrgUserProfileView {
    const profile = this.profiles.suspend(id, now);
    if (!profile) {
      throw new UserProfileError('PROFILE_NOT_FOUND', `Profile "${id}" not found or removed.`);
    }
    return this.toProfileView(profile);
  }

  reactivateProfile(id: string): OrgUserProfileView {
    const profile = this.profiles.reactivate(id);
    if (!profile) {
      throw new UserProfileError('PROFILE_NOT_FOUND', `Profile "${id}" not found or removed.`);
    }
    return this.toProfileView(profile);
  }

  // --- Bindings ---

  createBinding(input: CreateOrgUserBindingInput, now: Date): OrgUserBindingView {
    const binding = this.bindings.create(input.userId, input.role, now, {
      projectId: input.projectId,
      sectorId: input.sectorId,
      clientId: input.clientId,
      hasVaultAccess: input.hasVaultAccess,
    });
    return this.toBindingView(binding);
  }

  listBindingsByUser(userId: string): OrgUserBindingView[] {
    return this.bindings.findByUser(userId).map((b) => this.toBindingView(b));
  }

  listBindingsByProject(projectId: string): OrgUserBindingView[] {
    return this.bindings.findByProject(projectId).map((b) => this.toBindingView(b));
  }

  listBindings(): OrgUserBindingView[] {
    return this.bindings.findAll().map((b) => this.toBindingView(b));
  }

  revokeBinding(id: string, now: Date): OrgUserBindingView {
    const binding = this.bindings.revoke(id, now);
    if (!binding) {
      throw new UserProfileError('BINDING_NOT_FOUND', `Binding "${id}" not found or revoked.`);
    }
    return this.toBindingView(binding);
  }

  // --- View mappers ---

  private toProfileView(p: StoredUserProfile): OrgUserProfileView {
    return {
      id: p.id,
      userId: p.userId,
      role: p.role,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      suspendedAt: p.suspendedAt?.toISOString(),
    };
  }

  private toBindingView(b: StoredUserBinding): OrgUserBindingView {
    return {
      id: b.id,
      userId: b.userId,
      projectId: b.projectId,
      sectorId: b.sectorId,
      clientId: b.clientId,
      role: b.role,
      hasVaultAccess: b.hasVaultAccess,
      createdAt: b.createdAt.toISOString(),
      revokedAt: b.revokedAt?.toISOString(),
    };
  }
}
