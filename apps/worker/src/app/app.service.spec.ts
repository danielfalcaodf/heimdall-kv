import { AppService } from './app.service';
import type { WorkerQueueService } from './worker-queue.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    const workerQueue = {
      queueName: 'system.health.sanity',
      processSyntheticJob: jest.fn().mockResolvedValue({
        status: 'processed',
        processedAt: '2026-05-29T00:00:00.000Z',
        payloadPolicy: 'synthetic-only',
      }),
    } as unknown as WorkerQueueService;

    service = new AppService(workerQueue);
  });

  it('returns the worker bootstrap status without payload data', () => {
    expect(service.getData()).toEqual({
      service: 'Heimdall KV worker',
      queueName: 'system.health.sanity',
      payloadPolicy: 'synthetic-only',
    });
  });
});
