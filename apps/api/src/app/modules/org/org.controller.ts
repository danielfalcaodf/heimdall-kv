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

@Controller('org')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  // --- Clients ---

  @Post('clients')
  createClient(@Body() body: CreateOrgClientInput): OrgClientView {
    try {
      return this.orgService.createClient(body, new Date());
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
      return this.orgService.archiveClient(id, new Date());
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
      return this.orgService.createSector(body, new Date());
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
      return this.orgService.archiveSector(id, new Date());
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
      return this.orgService.createProject(body, new Date());
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
      return this.orgService.archiveProject(id, new Date());
    } catch (e) {
      if (e instanceof OrgError && e.code === 'PROJECT_NOT_FOUND') {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }
}
