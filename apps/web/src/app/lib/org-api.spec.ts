import { createOrgProject, getOrgBindings, getOrgClients } from './org-api';
import { getAuditEvents, getPermissions } from './admin-api';

describe('org/admin API clients', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);
  });

  it('lista clientes no endpoint real da API', async () => {
    await getOrgClients();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/org/clients',
      { cache: 'no-store' },
    );
  });

  it('cria projeto no endpoint real da API', async () => {
    await createOrgProject({ name: 'Portal', clientId: 'c1', sectorId: 's1' });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/org/projects',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lista vínculos de usuários no contrato compartilhado', async () => {
    await getOrgBindings();
    await getPermissions();

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3001/api/org/bindings',
      { cache: 'no-store' },
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3001/api/org/bindings',
      { cache: 'no-store' },
    );
  });

  it('lista auditoria no endpoint real da API', async () => {
    await getAuditEvents();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/audit/events',
      { cache: 'no-store' },
    );
  });
});
