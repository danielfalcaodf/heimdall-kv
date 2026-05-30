import { Inject, Injectable } from '@nestjs/common';
import type { HealthDependency } from '@heimdall/contracts';
import { createSanityQueue } from '@heimdall/queue';
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
export class RedisChecker implements IHealthChecker {
  constructor(@Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig) {}

  async check(checkedAt: string): Promise<HealthDependency> {
    const queue = createSanityQueue(this.config);
    try {
      await timeout(queue.getJobCounts('waiting'), HEALTH_TIMEOUT_MS);
      return { id: 'redis', label: 'Redis', status: 'operational', message: 'Redis respondeu ao ping de sanidade.', checkedAt };
    } catch {
      return { id: 'redis', label: 'Redis', status: 'unavailable', message: 'Redis indisponivel ou configuracao pendente.', checkedAt };
    } finally {
      await queue.close().catch(() => undefined);
    }
  }
}
