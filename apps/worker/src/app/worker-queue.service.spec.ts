import { processSanityJob, createSanityJobPayload } from '@heimdall/queue';

describe('sanity queue processor', () => {
  it('processes only a synthetic health payload', async () => {
    const result = await processSanityJob({
      data: createSanityJobPayload(new Date('2026-05-29T00:00:00.000Z')),
    });

    expect(result).toEqual({
      status: 'processed',
      processedAt: expect.any(String),
      payloadPolicy: 'synthetic-only',
    });
  });
});
