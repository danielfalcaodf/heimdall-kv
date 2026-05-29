import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  aggregateOperationalStatus,
  type HealthDependency,
  type HealthResponse,
} from '@heimdall/contracts';
import { createSanityJobPayload, createSanityQueue, processSanityJob } from '@heimdall/queue';
import type { RuntimeConfig } from '@heimdall/runtime-config';
import { LocalPrivateStorageAdapter } from '@heimdall/storage';
import { RUNTIME_CONFIG } from './runtime-config.provider';

const HEALTH_TIMEOUT_MS = 1200;

function timeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

function dependency(
  id: HealthDependency['id'],
  label: string,
  status: HealthDependency['status'],
  message: string,
  checkedAt: string,
): HealthDependency {
  return {
    id,
    label,
    status,
    message,
    checkedAt,
  };
}

@Injectable()
export class DependencyHealthService implements OnModuleDestroy {
  private readonly prisma: PrismaClient;

  constructor(@Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig) {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.databaseUrl,
        },
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async getHealth(now = new Date()): Promise<HealthResponse> {
    const checkedAt = now.toISOString();
    const dependencies = await Promise.all([
      Promise.resolve(
        dependency('api', 'API', 'operational', 'Servico HTTP respondendo.', checkedAt),
      ),
      this.checkDatabase(checkedAt),
      this.checkRedis(checkedAt),
      this.checkWorker(checkedAt),
      this.checkStorage(checkedAt),
      this.checkJobs(checkedAt),
    ]);

    return {
      checkedAt,
      status: aggregateOperationalStatus(dependencies.map((item) => item.status)),
      dependencies,
    };
  }

  private async checkDatabase(checkedAt: string): Promise<HealthDependency> {
    try {
      await timeout(this.prisma.$queryRaw`SELECT 1`, HEALTH_TIMEOUT_MS);
      return dependency(
        'database',
        'PostgreSQL',
        'operational',
        'Banco respondeu a consulta de sanidade.',
        checkedAt,
      );
    } catch {
      return dependency(
        'database',
        'PostgreSQL',
        'unavailable',
        'Banco indisponivel ou configuracao pendente.',
        checkedAt,
      );
    }
  }

  private async checkRedis(checkedAt: string): Promise<HealthDependency> {
    const queue = createSanityQueue(this.config);

    try {
      await timeout(queue.getJobCounts('waiting'), HEALTH_TIMEOUT_MS);

      return dependency(
        'redis',
        'Redis',
        'operational',
        'Redis respondeu ao ping de sanidade.',
        checkedAt,
      );
    } catch {
      return dependency(
        'redis',
        'Redis',
        'unavailable',
        'Redis indisponivel ou configuracao pendente.',
        checkedAt,
      );
    } finally {
      await queue.close().catch(() => undefined);
    }
  }

  private async checkWorker(checkedAt: string): Promise<HealthDependency> {
    try {
      await processSanityJob({ data: createSanityJobPayload(new Date(checkedAt)) });
      return dependency(
        'worker',
        'Worker',
        'operational',
        'Processador sintetico executou sem payload sensivel.',
        checkedAt,
      );
    } catch {
      return dependency(
        'worker',
        'Worker',
        'degraded',
        'Worker nao confirmou o job sintetico.',
        checkedAt,
      );
    }
  }

  private async checkStorage(checkedAt: string): Promise<HealthDependency> {
    const storage = new LocalPrivateStorageAdapter(this.config.storagePrivateRoot);

    try {
      await timeout(storage.healthCheck(), HEALTH_TIMEOUT_MS);
      return dependency(
        'storage',
        'Storage privado',
        'operational',
        'Storage privado local acessivel pelo adapter.',
        checkedAt,
      );
    } catch {
      return dependency(
        'storage',
        'Storage privado',
        'unavailable',
        'Storage privado indisponivel ou sem permissao local.',
        checkedAt,
      );
    }
  }

  private async checkJobs(checkedAt: string): Promise<HealthDependency> {
    const queue = createSanityQueue(this.config);

    try {
      await timeout(
        queue.add('health-check', createSanityJobPayload(new Date(checkedAt)), {
          attempts: 1,
          removeOnComplete: true,
          removeOnFail: true,
        }),
        HEALTH_TIMEOUT_MS,
      );

      return dependency(
        'jobs',
        'Fila BullMQ',
        'operational',
        'Job sintetico aceito pela fila.',
        checkedAt,
      );
    } catch {
      return dependency(
        'jobs',
        'Fila BullMQ',
        'unavailable',
        'Fila indisponivel ou aguardando Redis.',
        checkedAt,
      );
    } finally {
      await queue.close().catch(() => undefined);
    }
  }
}
