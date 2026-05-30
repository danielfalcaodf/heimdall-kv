import { Injectable } from '@nestjs/common';
import type { AuditEventView, CreateAuditEventInput } from '@heimdall/contracts';
import { AuditEventRepository, StoredAuditEvent } from './audit-event.repository';

const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordHash',
  'token',
  'tokenHash',
  'sessionToken',
  'secret',
]);

@Injectable()
export class AuditService {
  constructor(private readonly repo: AuditEventRepository) {}

  record(input: CreateAuditEventInput): AuditEventView {
    const sanitized = this.sanitizeInput(input);
    const event = this.repo.create(sanitized);
    return this.toView(event);
  }

  listByActor(actorUserId: string): AuditEventView[] {
    return this.repo.findByActor(actorUserId).map(this.toView);
  }

  listAll(): AuditEventView[] {
    return this.repo.findAll().map(this.toView);
  }

  private sanitizeInput(input: CreateAuditEventInput): CreateAuditEventInput {
    const sanitized = { ...input } as unknown as Record<string, unknown>;
    for (const key of SENSITIVE_FIELDS) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized as unknown as CreateAuditEventInput;
  }

  private toView(event: StoredAuditEvent): AuditEventView {
    return {
      id: event.id,
      actorUserId: event.actorUserId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      scopeType: event.scopeType,
      scopeId: event.scopeId,
      result: event.result,
      ipAddress: event.ipAddress,
      createdAt: event.createdAt.toISOString(),
    };
  }
}
