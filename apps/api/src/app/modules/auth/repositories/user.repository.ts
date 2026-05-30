import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { LocalUserStatus, LocalUserView, UserRole } from '@heimdall/contracts';

export interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: LocalUserStatus;
  createdAt: Date;
  activatedAt?: Date;
  passwordHash?: string;
  passwordSetAt?: Date;
}

export interface CreateUserInput {
  email: string;
  displayName?: string;
  role: UserRole;
  status: LocalUserStatus;
  now: Date;
}

@Injectable()
export class UserRepository {
  private readonly users = new Map<string, StoredUser>();
  private readonly usersByEmail = new Map<string, string>();

  create(input: CreateUserInput): StoredUser {
    const { email, role, now } = input;
    const displayName = input.displayName?.trim() || email.split('@')[0];
    const status = input.status;
    const user: StoredUser = {
      id: randomUUID(),
      email,
      displayName,
      role,
      status,
      createdAt: now,
      activatedAt: status === 'active' ? now : undefined,
    };
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);
    return user;
  }

  findById(id: string): StoredUser | undefined {
    return this.users.get(id);
  }

  findByEmail(email: string): StoredUser | undefined {
    const id = this.usersByEmail.get(email);
    return id ? this.users.get(id) : undefined;
  }

  toView(user: StoredUser): LocalUserView {
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
}
