import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { OrgUserProfileStatus, OrgUserRole } from '@heimdall/contracts';

export interface StoredUserProfile {
  id: string;
  userId: string;
  role: OrgUserRole;
  status: OrgUserProfileStatus;
  createdAt: Date;
  suspendedAt?: Date;
  removedAt?: Date;
}

@Injectable()
export class UserProfileRepository {
  private readonly profiles = new Map<string, StoredUserProfile>();
  private readonly profilesByUserId = new Map<string, string>();

  create(userId: string, role: OrgUserRole, now: Date): StoredUserProfile {
    const profile: StoredUserProfile = {
      id: randomUUID(),
      userId,
      role,
      status: 'active',
      createdAt: now,
    };
    this.profiles.set(profile.id, profile);
    this.profilesByUserId.set(userId, profile.id);
    return profile;
  }

  findById(id: string): StoredUserProfile | undefined {
    return this.profiles.get(id);
  }

  findByUserId(userId: string): StoredUserProfile | undefined {
    const id = this.profilesByUserId.get(userId);
    return id ? this.profiles.get(id) : undefined;
  }

  findAll(includeSuspended = false): StoredUserProfile[] {
    return Array.from(this.profiles.values()).filter(
      (p) => p.removedAt === undefined && (includeSuspended || p.status === 'active'),
    );
  }

  suspend(id: string, now: Date): StoredUserProfile | undefined {
    const profile = this.profiles.get(id);
    if (!profile || profile.removedAt) return undefined;
    profile.status = 'suspended';
    profile.suspendedAt = now;
    return profile;
  }

  reactivate(id: string): StoredUserProfile | undefined {
    const profile = this.profiles.get(id);
    if (!profile || profile.removedAt) return undefined;
    profile.status = 'active';
    profile.suspendedAt = undefined;
    return profile;
  }

  remove(id: string, now: Date): StoredUserProfile | undefined {
    const profile = this.profiles.get(id);
    if (!profile || profile.removedAt) return undefined;
    profile.status = 'removed';
    profile.removedAt = now;
    return profile;
  }
}
