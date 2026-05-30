import { Inject, Injectable } from '@nestjs/common';
import type { HealthDependency } from '@heimdall/contracts';
import { createSanityJobPayload, createSanityQueue } from '@heimdall/queue';
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
export class JobsChecker implements IHealthChecker {
  constructor(@Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig) {}

  async check(checkedAt: string): Promise<HealthDependency> {
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
      return { id: 'jobs', label: 'Fila BullMQ', status: 'operational', message: 'Job sintetico aceito pela fila.', checkedAt };
    } catch {
      return { id: 'jobs', label: 'Fila BullMQ', status: 'unavailable', message: 'Fila indisponivel ou aguardando Redis.', checkedAt };
    } finally {
      await queue.close().catch(() => undefined);
    }
  }
}
