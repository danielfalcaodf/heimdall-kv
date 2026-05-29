import { Injectable } from '@nestjs/common';
import type { SanityJobResult } from '@heimdall/queue';
import { WorkerQueueService } from './worker-queue.service';

@Injectable()
export class AppService {
  constructor(private readonly workerQueue: WorkerQueueService) {}

  getData(): { service: string; queueName: string; payloadPolicy: string } {
    return {
      service: 'Heimdall KV worker',
      queueName: this.workerQueue.queueName,
      payloadPolicy: 'synthetic-only',
    };
  }

  processSanityJob(): Promise<SanityJobResult> {
    return this.workerQueue.processSyntheticJob();
  }
}
