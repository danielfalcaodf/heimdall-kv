import { Injectable } from '@nestjs/common';
import type { HealthDependency } from '@heimdall/contracts';
import { createSanityJobPayload, processSanityJob } from '@heimdall/queue';
import type { IHealthChecker } from '../health-checker.interface';

@Injectable()
export class WorkerChecker implements IHealthChecker {
  async check(checkedAt: string): Promise<HealthDependency> {
    try {
      await processSanityJob({ data: createSanityJobPayload(new Date(checkedAt)) });
      return { id: 'worker', label: 'Worker', status: 'operational', message: 'Processador sintetico executou sem payload sensivel.', checkedAt };
    } catch {
      return { id: 'worker', label: 'Worker', status: 'degraded', message: 'Worker nao confirmou o job sintetico.', checkedAt };
    }
  }
}
