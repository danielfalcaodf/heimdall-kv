import { Module } from '@nestjs/common';
import { OrgService } from './org.service';
import { OrgController } from './org.controller';
import { UserProfileService } from './user-profile.service';
import { UserProfileController } from './user-profile.controller';

@Module({
  providers: [OrgService, UserProfileService],
  controllers: [OrgController, UserProfileController],
  exports: [OrgService, UserProfileService],
})
export class OrgModule {}
