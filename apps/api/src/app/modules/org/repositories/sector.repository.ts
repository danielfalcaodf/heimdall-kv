import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { OrgEntityStatus } from '@heimdall/contracts';

export interface StoredSector {
  id: string;
  clientId: string;
  name: string;
  status: OrgEntityStatus;
  createdAt: Date;
  archivedAt?: Date;
  deletedAt?: Date;
}

@Injectable()
export class SectorRepository {
  private readonly sectors = new Map<string, StoredSector>();

  create(clientId: string, name: string, now: Date): StoredSector {
    const sector: StoredSector = {
      id: randomUUID(),
      clientId,
      name: name.trim(),
      status: 'active',
      createdAt: now,
    };
    this.sectors.set(sector.id, sector);
    return sector;
  }

  findById(id: string): StoredSector | undefined {
    return this.sectors.get(id);
  }

  findByClient(clientId: string, includeArchived = false): StoredSector[] {
    return Array.from(this.sectors.values()).filter(
      (s) =>
        s.clientId === clientId &&
        s.deletedAt === undefined &&
        (includeArchived || s.status === 'active'),
    );
  }

  findAll(includeArchived = false): StoredSector[] {
    return Array.from(this.sectors.values()).filter(
      (s) => s.deletedAt === undefined && (includeArchived || s.status === 'active'),
    );
  }

  archive(id: string, now: Date): StoredSector | undefined {
    const sector = this.sectors.get(id);
    if (!sector || sector.deletedAt) return undefined;
    sector.status = 'archived';
    sector.archivedAt = now;
    return sector;
  }

  softDelete(id: string, now: Date): StoredSector | undefined {
    const sector = this.sectors.get(id);
    if (!sector || sector.deletedAt) return undefined;
    sector.status = 'deleted';
    sector.deletedAt = now;
    return sector;
  }

  restore(id: string): StoredSector | undefined {
    const sector = this.sectors.get(id);
    if (!sector || sector.status !== 'archived') return undefined;
    sector.status = 'active';
    sector.archivedAt = undefined;
    return sector;
  }
}
