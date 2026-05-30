import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { LocalSessionStatus, LocalSessionView } from '@heimdall/contracts';

export interface StoredSession {
  id: string;
  userId: string;
  sessionTokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
}

export interface CreateSessionInput {
  userId: string;
  sessionTokenHash: string;
  expiresAt: Date;
  now: Date;
}

@Injectable()
export class SessionRepository {
  private readonly sessions = new Map<string, StoredSession>();
  private readonly byTokenHash = new Map<string, string>();

  create(input: CreateSessionInput): StoredSession {
    const session: StoredSession = {
      id: randomUUID(),
      userId: input.userId,
      sessionTokenHash: input.sessionTokenHash,
      createdAt: input.now,
      expiresAt: input.expiresAt,
    };
    this.sessions.set(session.id, session);
    this.byTokenHash.set(session.sessionTokenHash, session.id);
    return session;
  }

  findById(id: string): StoredSession | undefined {
    return this.sessions.get(id);
  }

  findByTokenHash(tokenHash: string): StoredSession | undefined {
    const id = this.byTokenHash.get(tokenHash);
    return id ? this.sessions.get(id) : undefined;
  }

  statusOf(session: StoredSession, now: Date): LocalSessionStatus {
    if (session.revokedAt) return 'revoked';
    return session.expiresAt.getTime() <= now.getTime() ? 'expired' : 'active';
  }

  toView(session: StoredSession, now: Date): LocalSessionView {
    return {
      id: session.id,
      userId: session.userId,
      status: this.statusOf(session, now),
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      revokedAt: session.revokedAt?.toISOString(),
    };
  }
}
