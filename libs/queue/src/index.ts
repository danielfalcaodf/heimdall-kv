import { Queue, Worker } from 'bullmq';
import type { Job } from 'bullmq';
import type { RuntimeConfig } from '@heimdall/runtime-config';

export interface SanityJobPayload {
  kind: 'health-check';
  probeId: 'synthetic';
  requestedAt: string;
}

export interface SanityJobResult {
  status: 'processed';
  processedAt: string;
  payloadPolicy: 'synthetic-only';
}

export function createSanityJobPayload(now = new Date()): SanityJobPayload {
  return {
    kind: 'health-check',
    probeId: 'synthetic',
    requestedAt: now.toISOString(),
  };
}

export async function processSanityJob(
  _job: Pick<Job<SanityJobPayload>, 'data'>,
  now = new Date(),
): Promise<SanityJobResult> {
  return {
    status: 'processed',
    processedAt: now.toISOString(),
    payloadPolicy: 'synthetic-only',
  };
}

export function createQueueConnection(config: RuntimeConfig) {
  return {
    host: config.redisHost,
    port: config.redisPort,
  };
}

export function createSanityQueue(config: RuntimeConfig) {
  return new Queue<SanityJobPayload>(config.healthQueueName, {
    connection: createQueueConnection(config),
  });
}

export function createSanityWorker(config: RuntimeConfig) {
  return new Worker<SanityJobPayload, SanityJobResult>(
    config.healthQueueName,
    (job) => processSanityJob(job),
    {
      connection: createQueueConnection(config),
      autorun: false,
    },
  );
}
