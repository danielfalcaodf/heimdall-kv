import { Module } from '@nestjs/common';
import { OrgService } from './org.service';
import { OrgController } from './org.controller';
import { UserProfileService } from './user-profile.service';
import { UserProfileController } from './user-profile.controller';
import { DeletionPolicyService } from './deletion-policy.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [OrgService, UserProfileService, DeletionPolicyService],
  controllers: [OrgController, UserProfileController],
  exports: [OrgService, UserProfileService, DeletionPolicyService],
})
export class OrgModule {}
