import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { HealthDependency } from '@heimdall/contracts';
import type { RuntimeConfig } from '@heimdall/runtime-config';
import { RUNTIME_CONFIG } from '../../../runtime-config.provider';
import type { IHealthChecker } from '../health-checker.interface';

const HEALTH_TIMEOUT_MS = 1200;

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(resolve).catch(reject).finally(() => clearTimeout(timer));
  });
}

@Injectable()
export class DatabaseChecker implements IHealthChecker, OnModuleDestroy {
  private readonly prisma: PrismaClient;

  constructor(@Inject(RUNTIME_CONFIG) config: RuntimeConfig) {
    this.prisma = new PrismaClient({ datasources: { db: { url: config.db.url } } });
  }

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async check(checkedAt: string): Promise<HealthDependency> {
    try {
      await timeout(this.prisma.$queryRaw`SELECT 1`, HEALTH_TIMEOUT_MS);
      return { id: 'database', label: 'PostgreSQL', status: 'operational', message: 'Banco respondeu a consulta de sanidade.', checkedAt };
    } catch {
      return { id: 'database', label: 'PostgreSQL', status: 'unavailable', message: 'Banco indisponivel ou configuracao pendente.', checkedAt };
    }
  }
}
