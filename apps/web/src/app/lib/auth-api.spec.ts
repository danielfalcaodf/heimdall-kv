import { acceptInvite, createInvite, validateInviteToken } from './auth-api';

describe('auth-api client', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        user: { email: 'user@example.com' },
        delivery: { expiresAt: '2026-01-02T00:00:00.000Z' },
      }),
    } as Response);
  });

  it('valida convite usando o contrato real da API', async () => {
    await validateInviteToken('tok-123');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/invite/tok-123',
      { cache: 'no-store' },
    );
  });

  it('aceita convite usando o contrato real da API', async () => {
    await acceptInvite('tok-123', 'ValidPass1!');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/invite/tok-123/accept',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('cria convite sem retornar link sensível para a tela', async () => {
    const result = await createInvite('user@example.com', 'viewer');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/invite',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(JSON.stringify(result)).not.toMatch(/invitePath|convite\/|token/i);
  });
});
