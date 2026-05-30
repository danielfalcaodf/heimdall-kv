import { render, screen } from '@testing-library/react';
import AdminPermissoesPage from './page';
import * as adminApi from '../../lib/admin-api';

jest.mock('../../lib/admin-api');

const mockGetPermissions = adminApi.getPermissions as jest.MockedFunction<typeof adminApi.getPermissions>;

describe('AdminPermissoesPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exibe estado vazio quando não há vínculos', async () => {
    mockGetPermissions.mockResolvedValue([]);
    render(await AdminPermissoesPage());
    expect(screen.getByText(/nenhum vínculo/i)).toBeInTheDocument();
  });

  it('exibe vínculo com vault habilitado', async () => {
    mockGetPermissions.mockResolvedValue([
      {
        id: 'b1',
        userId: 'u1',
        projectId: 'proj-1',
        role: 'editor',
        hasVaultAccess: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    render(await AdminPermissoesPage());
    expect(screen.getByText('u1')).toBeInTheDocument();
    expect(screen.getByText('Sim')).toBeInTheDocument();
  });

  it('exibe vínculo sem vault', async () => {
    mockGetPermissions.mockResolvedValue([
      {
        id: 'b2',
        userId: 'u2',
        projectId: 'proj-1',
        role: 'viewer',
        hasVaultAccess: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    render(await AdminPermissoesPage());
    expect(screen.getByText('Não')).toBeInTheDocument();
  });

  it('não exibe tokens ou segredos', async () => {
    mockGetPermissions.mockResolvedValue([]);
    render(await AdminPermissoesPage());
    const content = document.body.textContent ?? '';
    expect(content).not.toMatch(/token/i);
    expect(content).not.toMatch(/secret/i);
  });
});
