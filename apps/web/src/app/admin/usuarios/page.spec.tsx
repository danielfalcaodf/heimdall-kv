import { render, screen } from '@testing-library/react';
import AdminUsuariosPage from './page';
import * as orgApi from '../../lib/org-api';

jest.mock('../../lib/org-api');

const mockGetUsers = orgApi.getOrgUsers as jest.MockedFunction<typeof orgApi.getOrgUsers>;

describe('AdminUsuariosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe estado vazio quando não há usuários', async () => {
    mockGetUsers.mockResolvedValue([]);
    render(await AdminUsuariosPage());
    expect(screen.getByText(/nenhum usuário/i)).toBeInTheDocument();
  });

  it('exibe lista de usuários com papel e status', async () => {
    mockGetUsers.mockResolvedValue([
      {
        id: 'p1',
        userId: 'u1',
        role: 'admin',
        status: 'active',
        createdAt: new Date('2026-01-01').toISOString(),
      },
    ]);

    render(await AdminUsuariosPage());

    expect(screen.getByText('u1')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('exibe usuário suspenso com label correto', async () => {
    mockGetUsers.mockResolvedValue([
      {
        id: 'p2',
        userId: 'u2',
        role: 'viewer',
        status: 'suspended',
        createdAt: new Date('2026-01-01').toISOString(),
      },
    ]);

    render(await AdminUsuariosPage());

    expect(screen.getByText('Suspenso')).toBeInTheDocument();
    expect(screen.getByText('Visualizador')).toBeInTheDocument();
  });

  it('não exibe tokens de convite ou segredos', async () => {
    mockGetUsers.mockResolvedValue([
      {
        id: 'p3',
        userId: 'u3',
        role: 'editor',
        status: 'active',
        createdAt: new Date('2026-01-01').toISOString(),
      },
    ]);

    render(await AdminUsuariosPage());

    const content = document.body.textContent ?? '';
    expect(content).not.toMatch(/token/i);
    expect(content).not.toMatch(/password/i);
    expect(content).not.toMatch(/secret/i);
  });

  it('possui heading principal acessível', async () => {
    mockGetUsers.mockResolvedValue([]);
    render(await AdminUsuariosPage());
    expect(screen.getByRole('heading', { name: /usuários e perfis/i })).toBeInTheDocument();
  });
});
