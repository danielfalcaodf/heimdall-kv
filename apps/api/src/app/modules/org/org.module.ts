import { Module } from '@nestjs/common';
import { OrgService } from './org.service';
import { OrgController } from './org.controller';
import { UserProfileService } from './user-profile.service';
import { UserProfileController } from './user-profile.controller';
import { DeletionPolicyService } from './deletion-policy.service';
import { AuditModule } from '../audit/audit.module';
import { ClientRepository } from './repositories/client.repository';
import { SectorRepository } from './repositories/sector.repository';
import { ProjectRepository } from './repositories/project.repository';
import { UserProfileRepository } from './repositories/user-profile.repository';
import { UserBindingRepository } from './repositories/user-binding.repository';

@Module({
  imports: [AuditModule],
  providers: [
    ClientRepository,
    SectorRepository,
    ProjectRepository,
    UserProfileRepository,
    UserBindingRepository,
    OrgService,
    UserProfileService,
    DeletionPolicyService,
  ],
  controllers: [OrgController, UserProfileController],
  exports: [OrgService, UserProfileService, UserBindingRepository, DeletionPolicyService],
})
export class OrgModule {}
