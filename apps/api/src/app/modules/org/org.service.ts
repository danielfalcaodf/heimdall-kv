import { Injectable } from '@nestjs/common';
import type {
  CreateOrgClientInput,
  CreateOrgProjectInput,
  CreateOrgSectorInput,
  OrgClientView,
  OrgProjectView,
  OrgSectorView,
} from '@heimdall/contracts';
import { ClientRepository, StoredClient } from './repositories/client.repository';
import { SectorRepository, StoredSector } from './repositories/sector.repository';
import { ProjectRepository, StoredProject } from './repositories/project.repository';

type OrgErrorCode =
  | 'INVALID_NAME'
  | 'CLIENT_NOT_FOUND'
  | 'CLIENT_NOT_ACTIVE'
  | 'SECTOR_NOT_FOUND'
  | 'SECTOR_NOT_ACTIVE'
  | 'SECTOR_CLIENT_MISMATCH'
  | 'PROJECT_NOT_FOUND'
  | 'PROJECT_NOT_ACTIVE';

export class OrgError extends Error {
  constructor(
    readonly code: OrgErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'OrgError';
  }
}

export interface ListClientsOptions {
  includeArchived?: boolean;
}

export interface ListSectorsOptions {
  clientId?: string;
  includeArchived?: boolean;
}

export interface ListProjectsOptions {
  clientId?: string;
  sectorId?: string;
  includeArchived?: boolean;
}

@Injectable()
export class OrgService {
  private readonly clients: ClientRepository;
  private readonly sectors: SectorRepository;
  private readonly projects: ProjectRepository;

  constructor(
    clients?: ClientRepository,
    sectors?: SectorRepository,
    projects?: ProjectRepository,
  ) {
    this.clients = clients ?? new ClientRepository();
    this.sectors = sectors ?? new SectorRepository();
    this.projects = projects ?? new ProjectRepository();
  }

  // --- Clients ---

  createClient(input: CreateOrgClientInput, now: Date): OrgClientView {
    const name = input.name?.trim();
    if (!name) {
      throw new OrgError('INVALID_NAME', 'Client name must not be blank.');
    }
    const client = this.clients.create(name, now);
    return this.toClientView(client);
  }

  listClients(options: ListClientsOptions = {}): OrgClientView[] {
    return this.clients.findAll(options.includeArchived).map((c) => this.toClientView(c));
  }

  archiveClient(id: string, now: Date): OrgClientView {
    const client = this.clients.archive(id, now);
    if (!client) {
      throw new OrgError('CLIENT_NOT_FOUND', `Client "${id}" not found or already deleted.`);
    }
    return this.toClientView(client);
  }

  // --- Sectors ---

  createSector(input: CreateOrgSectorInput, now: Date): OrgSectorView {
    const name = input.name?.trim();
    if (!name) {
      throw new OrgError('INVALID_NAME', 'Sector name must not be blank.');
    }
    const client = this.clients.findById(input.clientId);
    if (!client || client.deletedAt) {
      throw new OrgError('CLIENT_NOT_FOUND', `Client "${input.clientId}" not found.`);
    }
    if (client.status !== 'active') {
      throw new OrgError(
        'CLIENT_NOT_ACTIVE',
        `Client "${input.clientId}" is ${client.status}. Cannot create sector.`,
      );
    }
    const sector = this.sectors.create(input.clientId, name, now);
    return this.toSectorView(sector);
  }

  listSectors(options: ListSectorsOptions = {}): OrgSectorView[] {
    const all = options.clientId
      ? this.sectors.findByClient(options.clientId, options.includeArchived)
      : this.sectors.findAll(options.includeArchived);
    return all.map((s) => this.toSectorView(s));
  }

  archiveSector(id: string, now: Date): OrgSectorView {
    const sector = this.sectors.archive(id, now);
    if (!sector) {
      throw new OrgError('SECTOR_NOT_FOUND', `Sector "${id}" not found or already deleted.`);
    }
    return this.toSectorView(sector);
  }

  // --- Projects ---

  createProject(input: CreateOrgProjectInput, now: Date): OrgProjectView {
    const name = input.name?.trim();
    if (!name) {
      throw new OrgError('INVALID_NAME', 'Project name must not be blank.');
    }
    const client = this.clients.findById(input.clientId);
    if (!client || client.deletedAt) {
      throw new OrgError('CLIENT_NOT_FOUND', `Client "${input.clientId}" not found.`);
    }
    if (client.status !== 'active') {
      throw new OrgError(
        'CLIENT_NOT_ACTIVE',
        `Client "${input.clientId}" is ${client.status}. Cannot create project.`,
      );
    }
    if (input.sectorId) {
      const sector = this.sectors.findById(input.sectorId);
      if (!sector || sector.deletedAt) {
        throw new OrgError('SECTOR_NOT_FOUND', `Sector "${input.sectorId}" not found.`);
      }
      if (sector.clientId !== input.clientId) {
        throw new OrgError(
          'SECTOR_CLIENT_MISMATCH',
          `Sector "${input.sectorId}" does not belong to client "${input.clientId}".`,
        );
      }
    }
    const project = this.projects.create(input.clientId, name, now, input.sectorId);
    return this.toProjectView(project);
  }

  listProjects(options: ListProjectsOptions = {}): OrgProjectView[] {
    const all = options.clientId
      ? this.projects.findByClient(options.clientId, options.includeArchived)
      : this.projects.findAll(options.includeArchived);
    return all
      .filter((p) => !options.sectorId || p.sectorId === options.sectorId)
      .map((p) => this.toProjectView(p));
  }

  archiveProject(id: string, now: Date): OrgProjectView {
    const project = this.projects.archive(id, now);
    if (!project) {
      throw new OrgError('PROJECT_NOT_FOUND', `Project "${id}" not found or already deleted.`);
    }
    return this.toProjectView(project);
  }

  // --- View mappers ---

  private toClientView(c: StoredClient): OrgClientView {
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      archivedAt: c.archivedAt?.toISOString(),
    };
  }

  private toSectorView(s: StoredSector): OrgSectorView {
    return {
      id: s.id,
      clientId: s.clientId,
      name: s.name,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      archivedAt: s.archivedAt?.toISOString(),
    };
  }

  private toProjectView(p: StoredProject): OrgProjectView {
    return {
      id: p.id,
      clientId: p.clientId,
      sectorId: p.sectorId,
      name: p.name,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      archivedAt: p.archivedAt?.toISOString(),
    };
  }
}
