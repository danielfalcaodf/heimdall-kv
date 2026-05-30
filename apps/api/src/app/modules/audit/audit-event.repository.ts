import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { AuditResult, AuditScopeType } from '@heimdall/contracts';

export interface StoredAuditEvent {
  id: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  scopeType?: AuditScopeType;
  scopeId?: string;
  result: AuditResult;
  ipAddress?: string;
  createdAt: Date;
}

@Injectable()
export class AuditEventRepository {
  private readonly events = new Map<string, StoredAuditEvent>();

  create(input: Omit<StoredAuditEvent, 'id' | 'createdAt'>, now = new Date()): StoredAuditEvent {
    const event: StoredAuditEvent = { id: randomUUID(), createdAt: now, ...input };
    this.events.set(event.id, event);
    return event;
  }

  findByActor(actorUserId: string): StoredAuditEvent[] {
    return Array.from(this.events.values()).filter((e) => e.actorUserId === actorUserId);
  }

  findAll(): StoredAuditEvent[] {
    return Array.from(this.events.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}
