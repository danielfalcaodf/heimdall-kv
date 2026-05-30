import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { OrgEntityStatus } from '@heimdall/contracts';

export interface StoredClient {
  id: string;
  name: string;
  status: OrgEntityStatus;
  createdAt: Date;
  archivedAt?: Date;
  deletedAt?: Date;
}

@Injectable()
export class ClientRepository {
  private readonly clients = new Map<string, StoredClient>();

  create(name: string, now: Date): StoredClient {
    const client: StoredClient = {
      id: randomUUID(),
      name: name.trim(),
      status: 'active',
      createdAt: now,
    };
    this.clients.set(client.id, client);
    return client;
  }

  findById(id: string): StoredClient | undefined {
    return this.clients.get(id);
  }

  findAll(includeArchived = false): StoredClient[] {
    return Array.from(this.clients.values()).filter(
      (c) => c.deletedAt === undefined && (includeArchived || c.status === 'active'),
    );
  }

  archive(id: string, now: Date): StoredClient | undefined {
    const client = this.clients.get(id);
    if (!client || client.deletedAt) return undefined;
    client.status = 'archived';
    client.archivedAt = now;
    return client;
  }

  softDelete(id: string, now: Date): StoredClient | undefined {
    const client = this.clients.get(id);
    if (!client || client.deletedAt) return undefined;
    client.status = 'deleted';
    client.deletedAt = now;
    return client;
  }
}
