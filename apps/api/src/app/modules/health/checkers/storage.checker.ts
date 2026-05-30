import { Inject, Injectable } from '@nestjs/common';
import type { HealthDependency } from '@heimdall/contracts';
import type { RuntimeConfig } from '@heimdall/runtime-config';
import { LocalPrivateStorageAdapter } from '@heimdall/storage';
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
export class StorageChecker implements IHealthChecker {
  constructor(@Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig) {}

  async check(checkedAt: string): Promise<HealthDependency> {
    const storage = new LocalPrivateStorageAdapter(this.config.storage.privateRoot);
    try {
      await timeout(storage.healthCheck(), HEALTH_TIMEOUT_MS);
      return { id: 'storage', label: 'Storage privado', status: 'operational', message: 'Storage privado local acessivel pelo adapter.', checkedAt };
    } catch {
      return { id: 'storage', label: 'Storage privado', status: 'unavailable', message: 'Storage privado indisponivel ou sem permissao local.', checkedAt };
    }
  }
}
