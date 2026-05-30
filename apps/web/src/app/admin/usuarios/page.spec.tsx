import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminUsuariosPage from './page';
import * as authApi from '../../lib/auth-api';
import * as orgApi from '../../lib/org-api';

jest.mock('../../lib/auth-api');
jest.mock('../../lib/org-api');

const mockGetUsers = orgApi.getOrgUsers as jest.MockedFunction<typeof orgApi.getOrgUsers>;
const mockGetBindings = orgApi.getOrgBindings as jest.MockedFunction<typeof orgApi.getOrgBindings>;
const mockCreateInvite = authApi.createInvite as jest.MockedFunction<typeof authApi.createInvite>;
const mockCreateProfile = orgApi.createOrgUserProfile as jest.MockedFunction<typeof orgApi.createOrgUserProfile>;
const mockSuspendProfile = orgApi.suspendOrgUserProfile as jest.MockedFunction<typeof orgApi.suspendOrgUserProfile>;
const mockReactivateProfile = orgApi.reactivateOrgUserProfile as jest.MockedFunction<typeof orgApi.reactivateOrgUserProfile>;
const mockCreateBinding = orgApi.createOrgBinding as jest.MockedFunction<typeof orgApi.createOrgBinding>;
const mockRevokeBinding = orgApi.revokeOrgBinding as jest.MockedFunction<typeof orgApi.revokeOrgBinding>;

describe('AdminUsuariosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBindings.mockResolvedValue([]);
    mockCreateInvite.mockResolvedValue({ ok: true, expiresAt: new Date('2026-01-02').toISOString() });
    mockCreateProfile.mockResolvedValue({
      id: 'p-new',
      userId: 'u-new',
      role: 'viewer',
      status: 'active',
      createdAt: new Date('2026-01-01').toISOString(),
    });
    mockSuspendProfile.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      role: 'viewer',
      status: 'suspended',
      createdAt: new Date('2026-01-01').toISOString(),
    });
    mockReactivateProfile.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      role: 'viewer',
      status: 'active',
      createdAt: new Date('2026-01-01').toISOString(),
    });
    mockCreateBinding.mockResolvedValue({
      id: 'b-new',
      userId: 'u1',
      projectId: 'proj-1',
      role: 'editor',
      hasVaultAccess: true,
      createdAt: new Date('2026-01-01').toISOString(),
    });
    mockRevokeBinding.mockResolvedValue({
      id: 'b1',
      userId: 'u1',
      projectId: 'proj-1',
      role: 'viewer',
      hasVaultAccess: false,
      createdAt: new Date('2026-01-01').toISOString(),
      revokedAt: new Date('2026-01-02').toISOString(),
    });
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

    expect(screen.getAllByText('u1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Administrador').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0);
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
    expect(screen.getAllByText('Visualizador').length).toBeGreaterThan(0);
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

  it('cria convite sem exibir o link completo', async () => {
    mockGetUsers.mockResolvedValue([]);

    render(await AdminUsuariosPage());

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'novo@example.com' } });
    fireEvent.submit(screen.getByRole('form', { name: /criar convite/i }));

    await waitFor(() => {
      expect(mockCreateInvite).toHaveBeenCalledWith('novo@example.com', 'viewer', undefined);
      expect(screen.getByRole('status')).toHaveTextContent('Convite criado.');
    });
    expect(document.body.textContent ?? '').not.toMatch(/convite\/[A-Za-z0-9]/);
  });

  it('cria perfil de usuário', async () => {
    mockGetUsers.mockResolvedValue([]);

    render(await AdminUsuariosPage());

    fireEvent.change(screen.getByLabelText(/id de usuário/i, { selector: '#profile-user-id' }), { target: { value: 'u44' } });
    fireEvent.change(screen.getByLabelText(/^papel$/i, { selector: '#profile-role' }), { target: { value: 'editor' } });
    fireEvent.submit(screen.getByRole('form', { name: /criar perfil/i }));

    await waitFor(() => {
      expect(mockCreateProfile).toHaveBeenCalledWith({ userId: 'u44', role: 'editor' });
    });
  });

  it('suspende e reativa usuário selecionado', async () => {
    mockGetUsers.mockResolvedValue([
      {
        id: 'p1',
        userId: 'u1',
        role: 'viewer',
        status: 'active',
        createdAt: new Date('2026-01-01').toISOString(),
      },
    ]);

    render(await AdminUsuariosPage());

    fireEvent.change(screen.getByLabelText(/^perfil$/i, { selector: '#status-profile' }), { target: { value: 'p1' } });
    fireEvent.submit(screen.getByRole('form', { name: /alterar status/i }));
    await waitFor(() => expect(mockSuspendProfile).toHaveBeenCalledWith('p1'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Usuário suspenso.'));

    fireEvent.change(screen.getByLabelText(/^perfil$/i, { selector: '#status-profile' }), { target: { value: 'p1' } });
    fireEvent.click(screen.getByRole('button', { name: /reativar/i }));
    await waitFor(() => expect(mockReactivateProfile).toHaveBeenCalledWith('p1'));
  });

  it('cria e revoga vínculo com vault separado', async () => {
    mockGetUsers.mockResolvedValue([]);
    mockGetBindings.mockResolvedValue([
      {
        id: 'b1',
        userId: 'u1',
        projectId: 'proj-1',
        role: 'viewer',
        hasVaultAccess: false,
        createdAt: new Date('2026-01-01').toISOString(),
      },
    ]);

    render(await AdminUsuariosPage());

    fireEvent.change(screen.getByLabelText(/id de usuário/i, { selector: '#binding-user-id' }), { target: { value: 'u1' } });
    fireEvent.change(screen.getByLabelText(/id de projeto/i), { target: { value: 'proj-1' } });
    fireEvent.change(screen.getByLabelText(/^papel$/i, { selector: '#binding-role' }), { target: { value: 'editor' } });
    fireEvent.click(screen.getByLabelText(/^vault$/i));
    fireEvent.submit(screen.getByRole('form', { name: /criar vínculo/i }));

    await waitFor(() => {
      expect(mockCreateBinding).toHaveBeenCalledWith({
        userId: 'u1',
        role: 'editor',
        projectId: 'proj-1',
        hasVaultAccess: true,
      });
    });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Vínculo criado.'));

    fireEvent.change(screen.getByLabelText(/^vínculo$/i), { target: { value: 'b1' } });
    fireEvent.submit(screen.getByRole('form', { name: /revogar vínculo/i }));
    await waitFor(() => expect(mockRevokeBinding).toHaveBeenCalledWith('b1'));
  });
});
