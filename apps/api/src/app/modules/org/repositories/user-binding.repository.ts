import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { OrgUserRole } from '@heimdall/contracts';

export interface StoredUserBinding {
  id: string;
  userId: string;
  projectId?: string;
  sectorId?: string;
  clientId?: string;
  role: OrgUserRole;
  hasVaultAccess: boolean;
  createdAt: Date;
  revokedAt?: Date;
}

@Injectable()
export class UserBindingRepository {
  private readonly bindings = new Map<string, StoredUserBinding>();

  create(
    userId: string,
    role: OrgUserRole,
    now: Date,
    opts: { projectId?: string; sectorId?: string; clientId?: string; hasVaultAccess?: boolean },
  ): StoredUserBinding {
    const binding: StoredUserBinding = {
      id: randomUUID(),
      userId,
      projectId: opts.projectId,
      sectorId: opts.sectorId,
      clientId: opts.clientId,
      role,
      hasVaultAccess: opts.hasVaultAccess ?? false,
      createdAt: now,
    };
    this.bindings.set(binding.id, binding);
    return binding;
  }

  findById(id: string): StoredUserBinding | undefined {
    return this.bindings.get(id);
  }

  findByUser(userId: string, includeRevoked = false): StoredUserBinding[] {
    return Array.from(this.bindings.values()).filter(
      (b) => b.userId === userId && (includeRevoked || b.revokedAt === undefined),
    );
  }

  findByProject(projectId: string): StoredUserBinding[] {
    return Array.from(this.bindings.values()).filter(
      (b) => b.projectId === projectId && b.revokedAt === undefined,
    );
  }

  findAll(includeRevoked = false): StoredUserBinding[] {
    return Array.from(this.bindings.values()).filter(
      (b) => includeRevoked || b.revokedAt === undefined,
    );
  }

  revoke(id: string, now: Date): StoredUserBinding | undefined {
    const binding = this.bindings.get(id);
    if (!binding || binding.revokedAt) return undefined;
    binding.revokedAt = now;
    return binding;
  }
}
