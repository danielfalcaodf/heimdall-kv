import axios from 'axios';

describe('GET /api', () => {
  it('returns the API operational message', async () => {
    const res = await axios.get(`/api`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Heimdall KV API operacional' });
  });
});
