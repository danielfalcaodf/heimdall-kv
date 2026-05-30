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
  CreateOrgClientInput,
  CreateOrgProjectInput,
  CreateOrgSectorInput,
  OrgClientView,
  OrgProjectView,
  OrgSectorView,
} from '@heimdall/contracts';
import { OrgError, OrgService } from './org.service';
import { AuditService } from '../audit/audit.service';

@Controller('org')
export class OrgController {
  constructor(
    private readonly orgService: OrgService,
    private readonly auditService: AuditService,
  ) {}

  // --- Clients ---

  @Post('clients')
  createClient(@Body() body: CreateOrgClientInput): OrgClientView {
    try {
      const result = this.orgService.createClient(body, new Date());
      this.auditService.record({
        actorUserId: 'system',
        action: 'create_client',
        resourceType: 'client',
        resourceId: result.id,
        result: 'success',
      });
      return result;
    } catch (e) {
      if (e instanceof OrgError && e.code === 'INVALID_NAME') {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Get('clients')
  listClients(@Query('includeArchived') includeArchived?: string): OrgClientView[] {
    return this.orgService.listClients({ includeArchived: includeArchived === 'true' });
  }

  @Patch('clients/:id/archive')
  archiveClient(@Param('id') id: string): OrgClientView {
    try {
      const result = this.orgService.archiveClient(id, new Date());
      this.auditService.record({
        actorUserId: 'system',
        action: 'archive_client',
        resourceType: 'client',
        resourceId: id,
        result: 'success',
      });
      return result;
    } catch (e) {
      if (e instanceof OrgError && e.code === 'CLIENT_NOT_FOUND') {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  // --- Sectors ---

  @Post('sectors')
  createSector(@Body() body: CreateOrgSectorInput): OrgSectorView {
    try {
      const result = this.orgService.createSector(body, new Date());
      this.auditService.record({
        actorUserId: 'system',
        action: 'create_sector',
        resourceType: 'sector',
        resourceId: result.id,
        result: 'success',
      });
      return result;
    } catch (e) {
      if (e instanceof OrgError) {
        if (e.code === 'INVALID_NAME') throw new BadRequestException(e.message);
        if (e.code === 'CLIENT_NOT_FOUND') throw new NotFoundException(e.message);
        if (e.code === 'CLIENT_NOT_ACTIVE') throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Get('sectors')
  listSectors(
    @Query('clientId') clientId?: string,
    @Query('includeArchived') includeArchived?: string,
  ): OrgSectorView[] {
    return this.orgService.listSectors({
      clientId,
      includeArchived: includeArchived === 'true',
    });
  }

  @Patch('sectors/:id/archive')
  archiveSector(@Param('id') id: string): OrgSectorView {
    try {
      const result = this.orgService.archiveSector(id, new Date());
      this.auditService.record({
        actorUserId: 'system',
        action: 'archive_sector',
        resourceType: 'sector',
        resourceId: id,
        result: 'success',
      });
      return result;
    } catch (e) {
      if (e instanceof OrgError && e.code === 'SECTOR_NOT_FOUND') {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  // --- Projects ---

  @Post('projects')
  createProject(@Body() body: CreateOrgProjectInput): OrgProjectView {
    try {
      const result = this.orgService.createProject(body, new Date());
      this.auditService.record({
        actorUserId: 'system',
        action: 'create_project',
        resourceType: 'project',
        resourceId: result.id,
        result: 'success',
      });
      return result;
    } catch (e) {
      if (e instanceof OrgError) {
        if (e.code === 'INVALID_NAME') throw new BadRequestException(e.message);
        if (e.code === 'CLIENT_NOT_FOUND') throw new NotFoundException(e.message);
        if (e.code === 'CLIENT_NOT_ACTIVE') throw new BadRequestException(e.message);
        if (e.code === 'SECTOR_NOT_FOUND') throw new NotFoundException(e.message);
        if (e.code === 'SECTOR_CLIENT_MISMATCH') throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Get('projects')
  listProjects(
    @Query('clientId') clientId?: string,
    @Query('sectorId') sectorId?: string,
    @Query('includeArchived') includeArchived?: string,
  ): OrgProjectView[] {
    return this.orgService.listProjects({
      clientId,
      sectorId,
      includeArchived: includeArchived === 'true',
    });
  }

  @Patch('projects/:id/archive')
  archiveProject(@Param('id') id: string): OrgProjectView {
    try {
      const result = this.orgService.archiveProject(id, new Date());
      this.auditService.record({
        actorUserId: 'system',
        action: 'archive_project',
        resourceType: 'project',
        resourceId: id,
        result: 'success',
      });
      return result;
    } catch (e) {
      if (e instanceof OrgError && e.code === 'PROJECT_NOT_FOUND') {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }
}
