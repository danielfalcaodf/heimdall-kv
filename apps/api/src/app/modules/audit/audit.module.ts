import { Module } from '@nestjs/common';
import { AuditEventRepository } from './audit-event.repository';
import { AuditService } from './audit.service';

@Module({
  providers: [AuditEventRepository, AuditService],
  exports: [AuditService],
})
export class AuditModule {}
