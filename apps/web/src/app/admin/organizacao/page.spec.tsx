import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminOrganizacaoPage from './page';
import * as orgApi from '../../lib/org-api';

jest.mock('../../lib/org-api');

const mockGetClients = orgApi.getOrgClients as jest.MockedFunction<typeof orgApi.getOrgClients>;
const mockGetSectors = orgApi.getOrgSectors as jest.MockedFunction<typeof orgApi.getOrgSectors>;
const mockGetProjects = orgApi.getOrgProjects as jest.MockedFunction<typeof orgApi.getOrgProjects>;
const mockCreateClient = orgApi.createOrgClient as jest.MockedFunction<typeof orgApi.createOrgClient>;
const mockCreateSector = orgApi.createOrgSector as jest.MockedFunction<typeof orgApi.createOrgSector>;
const mockCreateProject = orgApi.createOrgProject as jest.MockedFunction<typeof orgApi.createOrgProject>;

describe('AdminOrganizacaoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue({
      id: 'new-client',
      name: 'Novo Cliente',
      status: 'active',
      createdAt: new Date('2026-01-01').toISOString(),
    });
    mockCreateSector.mockResolvedValue({
      id: 'new-sector',
      clientId: 'c1',
      name: 'Novo Setor',
      status: 'active',
      createdAt: new Date('2026-01-01').toISOString(),
    });
    mockCreateProject.mockResolvedValue({
      id: 'new-project',
      clientId: 'c1',
      name: 'Novo Projeto',
      status: 'active',
      createdAt: new Date('2026-01-01').toISOString(),
    });
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

    expect(screen.getAllByText('Cliente Alpha').length).toBeGreaterThan(0);
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

  it('cria cliente pela ação administrativa', async () => {
    mockGetClients.mockResolvedValue([]);
    mockGetSectors.mockResolvedValue([]);
    mockGetProjects.mockResolvedValue([]);

    render(await AdminOrganizacaoPage());

    fireEvent.change(screen.getByLabelText(/^cliente$/i, { selector: '#client-name' }), { target: { value: 'Cliente Novo' } });
    fireEvent.submit(screen.getByRole('form', { name: /criar cliente/i }));

    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalledWith({ name: 'Cliente Novo' });
      expect(screen.getByRole('status')).toHaveTextContent('Cliente criado.');
    });
  });

  it('cria setor vinculado ao cliente', async () => {
    mockGetClients.mockResolvedValue([
      { id: 'c1', name: 'Cliente Alpha', status: 'active', createdAt: new Date('2026-01-01').toISOString() },
    ]);
    mockGetSectors.mockResolvedValue([]);
    mockGetProjects.mockResolvedValue([]);

    render(await AdminOrganizacaoPage());

    fireEvent.change(screen.getByLabelText(/^setor$/i, { selector: '#sector-name' }), { target: { value: 'Financeiro' } });
    fireEvent.change(screen.getByLabelText(/^cliente$/i, { selector: '#sector-client' }), { target: { value: 'c1' } });
    fireEvent.submit(screen.getByRole('form', { name: /criar setor/i }));

    await waitFor(() => {
      expect(mockCreateSector).toHaveBeenCalledWith({ name: 'Financeiro', clientId: 'c1' });
    });
  });

  it('cria projeto vinculado a cliente e setor', async () => {
    mockGetClients.mockResolvedValue([
      { id: 'c1', name: 'Cliente Alpha', status: 'active', createdAt: new Date('2026-01-01').toISOString() },
    ]);
    mockGetSectors.mockResolvedValue([
      { id: 's1', clientId: 'c1', name: 'TI', status: 'active', createdAt: new Date('2026-01-01').toISOString() },
    ]);
    mockGetProjects.mockResolvedValue([]);

    render(await AdminOrganizacaoPage());

    fireEvent.change(screen.getByLabelText(/^projeto$/i), { target: { value: 'Portal' } });
    fireEvent.change(screen.getByLabelText(/^cliente$/i, { selector: '#project-client' }), { target: { value: 'c1' } });
    fireEvent.change(screen.getByLabelText(/^setor$/i, { selector: '#project-sector' }), { target: { value: 's1' } });
    fireEvent.submit(screen.getByRole('form', { name: /criar projeto/i }));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith({ name: 'Portal', clientId: 'c1', sectorId: 's1' });
    });
  });
});
