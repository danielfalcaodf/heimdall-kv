import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { OrgEntityStatus } from '@heimdall/contracts';

export interface StoredProject {
  id: string;
  clientId: string;
  sectorId?: string;
  name: string;
  status: OrgEntityStatus;
  createdAt: Date;
  archivedAt?: Date;
  deletedAt?: Date;
}

@Injectable()
export class ProjectRepository {
  private readonly projects = new Map<string, StoredProject>();

  create(clientId: string, name: string, now: Date, sectorId?: string): StoredProject {
    const project: StoredProject = {
      id: randomUUID(),
      clientId,
      sectorId,
      name: name.trim(),
      status: 'active',
      createdAt: now,
    };
    this.projects.set(project.id, project);
    return project;
  }

  findById(id: string): StoredProject | undefined {
    return this.projects.get(id);
  }

  findByClient(clientId: string, includeArchived = false): StoredProject[] {
    return Array.from(this.projects.values()).filter(
      (p) =>
        p.clientId === clientId &&
        p.deletedAt === undefined &&
        (includeArchived || p.status === 'active'),
    );
  }

  findAll(includeArchived = false): StoredProject[] {
    return Array.from(this.projects.values()).filter(
      (p) => p.deletedAt === undefined && (includeArchived || p.status === 'active'),
    );
  }

  archive(id: string, now: Date): StoredProject | undefined {
    const project = this.projects.get(id);
    if (!project || project.deletedAt) return undefined;
    project.status = 'archived';
    project.archivedAt = now;
    return project;
  }

  softDelete(id: string, now: Date): StoredProject | undefined {
    const project = this.projects.get(id);
    if (!project || project.deletedAt) return undefined;
    project.status = 'deleted';
    project.deletedAt = now;
    return project;
  }

  restore(id: string): StoredProject | undefined {
    const project = this.projects.get(id);
    if (!project || project.status !== 'archived') return undefined;
    project.status = 'active';
    project.archivedAt = undefined;
    return project;
  }
}
