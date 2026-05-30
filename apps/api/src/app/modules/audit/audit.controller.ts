import { Controller, Get, Query } from '@nestjs/common';
import type { AuditEventView } from '@heimdall/contracts';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('events')
  listEvents(@Query('actorUserId') actorUserId?: string): AuditEventView[] {
    if (actorUserId) {
      return this.auditService.listByActor(actorUserId);
    }
    return this.auditService.listAll();
  }
}
