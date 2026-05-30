import { render, screen } from '@testing-library/react';
import AdminAuditoriaPage from './page';
import * as adminApi from '../../lib/admin-api';

jest.mock('../../lib/admin-api');

const mockGetAuditEvents = adminApi.getAuditEvents as jest.MockedFunction<typeof adminApi.getAuditEvents>;

describe('AdminAuditoriaPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exibe estado vazio quando não há eventos', async () => {
    mockGetAuditEvents.mockResolvedValue([]);
    render(await AdminAuditoriaPage());
    expect(screen.getByText(/nenhum evento/i)).toBeInTheDocument();
  });

  it('exibe evento de auditoria com resultado sucesso', async () => {
    mockGetAuditEvents.mockResolvedValue([
      {
        id: 'e1',
        actorUserId: 'u1',
        action: 'login',
        resourceType: 'session',
        result: 'success',
        createdAt: new Date('2026-01-01T10:00:00Z').toISOString(),
      },
    ]);
    render(await AdminAuditoriaPage());
    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.getByText('Sucesso')).toBeInTheDocument();
  });

  it('exibe evento com resultado negado', async () => {
    mockGetAuditEvents.mockResolvedValue([
      {
        id: 'e2',
        actorUserId: 'u2',
        action: 'view_vault',
        resourceType: 'vault',
        result: 'denied',
        createdAt: new Date().toISOString(),
      },
    ]);
    render(await AdminAuditoriaPage());
    expect(screen.getByText('Negado')).toBeInTheDocument();
  });

  it('não exibe valores sensíveis nos eventos', async () => {
    mockGetAuditEvents.mockResolvedValue([
      {
        id: 'e3',
        actorUserId: 'u3',
        action: 'authenticate',
        resourceType: 'user',
        result: 'success',
        createdAt: new Date().toISOString(),
      },
    ]);
    render(await AdminAuditoriaPage());
    const content = document.body.textContent ?? '';
    expect(content).not.toMatch(/password/i);
    expect(content).not.toMatch(/secret/i);
    expect(content).not.toMatch(/token/i);
  });
});
