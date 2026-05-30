import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { LocalInvitationStatus, LocalInvitationView } from '@heimdall/contracts';

export type StoredInvitationStatus = Exclude<LocalInvitationStatus, 'expired'>;

export interface StoredInvitation {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  status: StoredInvitationStatus;
  createdAt: Date;
  expiresAt: Date;
  invalidatedAt?: Date;
  acceptedAt?: Date;
}

export interface CreateInvitationInput {
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  now: Date;
}

@Injectable()
export class InvitationRepository {
  private readonly invitations = new Map<string, StoredInvitation>();
  private readonly byTokenHash = new Map<string, string>();

  create(input: CreateInvitationInput): StoredInvitation {
    const invitation: StoredInvitation = {
      id: randomUUID(),
      userId: input.userId,
      email: input.email,
      tokenHash: input.tokenHash,
      status: 'pending',
      createdAt: input.now,
      expiresAt: input.expiresAt,
    };
    this.invitations.set(invitation.id, invitation);
    this.byTokenHash.set(invitation.tokenHash, invitation.id);
    return invitation;
  }

  findById(id: string): StoredInvitation | undefined {
    return this.invitations.get(id);
  }

  findByTokenHash(tokenHash: string): StoredInvitation | undefined {
    const id = this.byTokenHash.get(tokenHash);
    return id ? this.invitations.get(id) : undefined;
  }

  statusOf(invitation: StoredInvitation, now: Date): LocalInvitationStatus {
    if (invitation.status !== 'pending') return invitation.status;
    return invitation.expiresAt.getTime() <= now.getTime() ? 'expired' : 'pending';
  }

  toView(invitation: StoredInvitation, now: Date): LocalInvitationView {
    return {
      id: invitation.id,
      userId: invitation.userId,
      email: invitation.email,
      status: this.statusOf(invitation, now),
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt.toISOString(),
      invalidatedAt: invitation.invalidatedAt?.toISOString(),
      acceptedAt: invitation.acceptedAt?.toISOString(),
    };
  }
}
