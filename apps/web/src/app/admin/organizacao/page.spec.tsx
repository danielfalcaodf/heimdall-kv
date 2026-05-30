import { render, screen } from '@testing-library/react';
import AdminOrganizacaoPage from './page';
import * as orgApi from '../../lib/org-api';

jest.mock('../../lib/org-api');

const mockGetClients = orgApi.getOrgClients as jest.MockedFunction<typeof orgApi.getOrgClients>;
const mockGetSectors = orgApi.getOrgSectors as jest.MockedFunction<typeof orgApi.getOrgSectors>;
const mockGetProjects = orgApi.getOrgProjects as jest.MockedFunction<typeof orgApi.getOrgProjects>;

describe('AdminOrganizacaoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe estado vazio quando não há dados', async () => {
    mockGetClients.mockResolvedValue([]);
    mockGetSectors.mockResolvedValue([]);
    mockGetProjects.mockResolvedValue([]);

    render(await AdminOrganizacaoPage());

    const emptyStates = screen.getAllByText(/nenhum/i);
    expect(emptyStates.length).toBeGreaterThanOrEqual(3);
  });

  it('exibe lista de clientes quando dados disponíveis', async () => {
    mockGetClients.mockResolvedValue([
      { id: 'c1', name: 'Cliente Alpha', status: 'active', createdAt: new Date('2026-01-01').toISOString() },
    ]);
    mockGetSectors.mockResolvedValue([]);
    mockGetProjects.mockResolvedValue([]);

    render(await AdminOrganizacaoPage());

    expect(screen.getByText('Cliente Alpha')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('exibe lista de projetos com status arquivado', async () => {
    mockGetClients.mockResolvedValue([]);
    mockGetSectors.mockResolvedValue([]);
    mockGetProjects.mockResolvedValue([
      {
        id: 'p1',
        clientId: 'c1',
        name: 'Projeto Beta',
        status: 'archived',
        createdAt: new Date('2026-01-01').toISOString(),
      },
    ]);

    render(await AdminOrganizacaoPage());

    expect(screen.getByText('Projeto Beta')).toBeInTheDocument();
    expect(screen.getByText('Arquivado')).toBeInTheDocument();
  });

  it('possui heading principal e seções acessíveis', async () => {
    mockGetClients.mockResolvedValue([]);
    mockGetSectors.mockResolvedValue([]);
    mockGetProjects.mockResolvedValue([]);

    render(await AdminOrganizacaoPage());

    expect(screen.getByRole('heading', { name: /estrutura organizacional/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /clientes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /setores/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /projetos/i })).toBeInTheDocument();
  });
});
