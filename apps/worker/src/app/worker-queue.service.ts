import { Inject, Injectable } from '@nestjs/common';
import {
  createSanityJobPayload,
  createSanityWorker,
  processSanityJob,
  type SanityJobResult,
} from '@heimdall/queue';
import type { RuntimeConfig } from '@heimdall/runtime-config';
import { RUNTIME_CONFIG } from './runtime-config.provider';

@Injectable()
export class WorkerQueueService {
  constructor(@Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig) {}

  get queueName(): string {
    return this.config.redis.queueName;
  }

  async processSyntheticJob(now = new Date()): Promise<SanityJobResult> {
    const worker = createSanityWorker(this.config);

    try {
      return processSanityJob({
        data: createSanityJobPayload(now),
      });
    } finally {
      await worker.close().catch(() => undefined);
    }
  }
}
