import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type {
  CreateOrgUserBindingInput,
  CreateOrgUserProfileInput,
  OrgUserBindingView,
  OrgUserProfileView,
} from '@heimdall/contracts';
import { UserProfileError, UserProfileService } from './user-profile.service';

@Controller('org')
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Post('profiles')
  createProfile(@Body() body: CreateOrgUserProfileInput): OrgUserProfileView {
    try {
      return this.userProfileService.createProfile(body, new Date());
    } catch (e) {
      if (e instanceof UserProfileError && e.code === 'PROFILE_ALREADY_EXISTS') {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Get('profiles')
  listProfiles(@Query('includeSuspended') includeSuspended?: string): OrgUserProfileView[] {
    return this.userProfileService.listProfiles({
      includeSuspended: includeSuspended === 'true',
    });
  }

  @Patch('profiles/:id/suspend')
  suspendProfile(@Param('id') id: string): OrgUserProfileView {
    try {
      return this.userProfileService.suspendProfile(id, new Date());
    } catch (e) {
      if (e instanceof UserProfileError && e.code === 'PROFILE_NOT_FOUND') {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Patch('profiles/:id/reactivate')
  reactivateProfile(@Param('id') id: string): OrgUserProfileView {
    try {
      return this.userProfileService.reactivateProfile(id);
    } catch (e) {
      if (e instanceof UserProfileError && e.code === 'PROFILE_NOT_FOUND') {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Post('bindings')
  createBinding(@Body() body: CreateOrgUserBindingInput): OrgUserBindingView {
    return this.userProfileService.createBinding(body, new Date());
  }

  @Get('bindings')
  listBindings(
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
  ): OrgUserBindingView[] {
    if (projectId) {
      return this.userProfileService.listBindingsByProject(projectId);
    }
    if (userId) {
      return this.userProfileService.listBindingsByUser(userId);
    }
    return [];
  }

  @Patch('bindings/:id/revoke')
  revokeBinding(@Param('id') id: string): OrgUserBindingView {
    try {
      return this.userProfileService.revokeBinding(id, new Date());
    } catch (e) {
      if (e instanceof UserProfileError && e.code === 'BINDING_NOT_FOUND') {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }
}
