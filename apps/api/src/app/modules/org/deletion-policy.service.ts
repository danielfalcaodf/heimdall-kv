import { Injectable } from '@nestjs/common';
import type { OrgEntityStatus } from '@heimdall/contracts';
import { ClientRepository, StoredClient } from './repositories/client.repository';
import { SectorRepository, StoredSector } from './repositories/sector.repository';
import { ProjectRepository, StoredProject } from './repositories/project.repository';

export type DeletionResource = 'client' | 'sector' | 'project';

export class DeletionPolicyError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'ALREADY_DELETED' | 'NOT_ARCHIVED' | 'FORBIDDEN',
    message: string,
  ) {
    super(message);
    this.name = 'DeletionPolicyError';
  }
}

type AnyRecord = StoredClient | StoredSector | StoredProject;

@Injectable()
export class DeletionPolicyService {
  constructor(
    private readonly clientRepo: ClientRepository,
    private readonly sectorRepo: SectorRepository,
    private readonly projectRepo: ProjectRepository,
  ) {}

  archive(resource: DeletionResource, id: string, actorRole: string, now = new Date()): AnyRecord {
    this.requireAdmin(actorRole);
    const record = this.getRecord(resource, id);
    if (!record) throw new DeletionPolicyError('NOT_FOUND', `${resource} não encontrado.`);
    if (record.status === 'deleted') throw new DeletionPolicyError('ALREADY_DELETED', `${resource} já excluído definitivamente.`);

    const archived = this.callArchive(resource, id, now);
    if (!archived) throw new DeletionPolicyError('NOT_FOUND', `${resource} não encontrado.`);
    return archived;
  }

  restore(resource: DeletionResource, id: string, actorRole: string): AnyRecord {
    this.requireAdmin(actorRole);
    const record = this.getRecord(resource, id);
    if (!record) throw new DeletionPolicyError('NOT_FOUND', `${resource} não encontrado.`);
    if (record.status === 'deleted') throw new DeletionPolicyError('ALREADY_DELETED', `${resource} excluído definitivamente não pode ser restaurado.`);
    if (record.status !== 'archived') throw new DeletionPolicyError('NOT_ARCHIVED', `${resource} não está arquivado.`);

    const restored = this.callRestore(resource, id);
    if (!restored) throw new DeletionPolicyError('NOT_FOUND', `${resource} não encontrado.`);
    return restored;
  }

  deletePermanently(resource: DeletionResource, id: string, actorRole: string, now = new Date()): AnyRecord {
    this.requireAdmin(actorRole);
    const record = this.getRecord(resource, id);
    if (!record) throw new DeletionPolicyError('NOT_FOUND', `${resource} não encontrado.`);
    if (record.status !== 'archived') throw new DeletionPolicyError('NOT_ARCHIVED', `${resource} deve estar arquivado antes de ser excluído definitivamente.`);

    const deleted = this.callSoftDelete(resource, id, now);
    if (!deleted) throw new DeletionPolicyError('NOT_FOUND', `${resource} não encontrado.`);
    return deleted;
  }

  private requireAdmin(role: string): void {
    if (role !== 'admin') {
      throw new DeletionPolicyError('FORBIDDEN', 'Somente administradores podem executar operações de exclusão.');
    }
  }

  private getRecord(resource: DeletionResource, id: string): AnyRecord | undefined {
    switch (resource) {
      case 'client': return this.clientRepo.findById(id);
      case 'sector': return this.sectorRepo.findById(id);
      case 'project': return this.projectRepo.findById(id);
    }
  }

  private callArchive(resource: DeletionResource, id: string, now: Date): AnyRecord | undefined {
    switch (resource) {
      case 'client': return this.clientRepo.archive(id, now);
      case 'sector': return this.sectorRepo.archive(id, now);
      case 'project': return this.projectRepo.archive(id, now);
    }
  }

  private callRestore(resource: DeletionResource, id: string): AnyRecord | undefined {
    switch (resource) {
      case 'client': return this.clientRepo.restore(id);
      case 'sector': return this.sectorRepo.restore(id);
      case 'project': return this.projectRepo.restore(id);
    }
  }

  private callSoftDelete(resource: DeletionResource, id: string, now: Date): AnyRecord | undefined {
    switch (resource) {
      case 'client': return this.clientRepo.softDelete(id, now);
      case 'sector': return this.sectorRepo.softDelete(id, now);
      case 'project': return this.projectRepo.softDelete(id, now);
    }
  }
}
