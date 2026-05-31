import axios from 'axios';

describe('GET /api', () => {
  it('returns the worker operational metadata', async () => {
    const res = await axios.get(`/api`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({
      service: 'Heimdall KV worker',
      queueName: 'system.health.sanity',
      payloadPolicy: 'synthetic-only',
    });
  });
});
