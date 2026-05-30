import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ConvitePage from './invite-form';
import * as authApi from '../../../lib/auth-api';

jest.mock('../../../lib/auth-api');
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockValidate = authApi.validateInviteToken as jest.MockedFunction<typeof authApi.validateInviteToken>;
const mockAccept = authApi.acceptInvite as jest.MockedFunction<typeof authApi.acceptInvite>;

describe('ConvitePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe loading enquanto valida o token', () => {
    mockValidate.mockImplementation(() => new Promise(() => {}));
    render(<ConvitePage token="tok123" />);
    expect(screen.getByText(/validando convite/i)).toBeInTheDocument();
  });

  it('exibe erro seguro para convite inválido', async () => {
    mockValidate.mockResolvedValue({ valid: false, error: 'Convite inválido, expirado ou já utilizado.' });
    render(<ConvitePage token="tok-bad" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Convite inválido, expirado ou já utilizado.');
    });
  });

  it('exibe formulário de senha para convite válido', async () => {
    mockValidate.mockResolvedValue({ valid: true, email: 'user@test.com' });
    render(<ConvitePage token="tok-valid" />);

    await waitFor(() => {
      expect(screen.getByRole('form', { name: /aceite de convite/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/senha inicial/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
    });
  });

  it('exibe erro quando senhas não coincidem', async () => {
    mockValidate.mockResolvedValue({ valid: true, email: 'user@test.com' });
    render(<ConvitePage token="tok-valid" />);

    await waitFor(() => screen.getByLabelText(/senha inicial/i));

    fireEvent.change(screen.getByLabelText(/senha inicial/i), { target: { value: 'senha123A' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: 'diferente' } });
    fireEvent.click(screen.getByRole('button', { name: /ativar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não coincidem.');
  });

  it('ativa conta com sucesso quando senhas são iguais', async () => {
    mockValidate.mockResolvedValue({ valid: true, email: 'user@test.com' });
    mockAccept.mockResolvedValue({ ok: true });

    render(<ConvitePage token="tok-valid" />);
    await waitFor(() => screen.getByLabelText(/senha inicial/i));

    fireEvent.change(screen.getByLabelText(/senha inicial/i), { target: { value: 'senha123A' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: 'senha123A' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ativar/i }));
    });

    await waitFor(() => expect(mockAccept).toHaveBeenCalledWith('tok-valid', 'senha123A'));
  });

  it('senhas são sempre tipo password, nunca text', async () => {
    mockValidate.mockResolvedValue({ valid: true, email: 'user@test.com' });
    render(<ConvitePage token="tok-valid" />);

    await waitFor(() => screen.getByLabelText(/senha inicial/i));
    expect(screen.getByLabelText(/senha inicial/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/confirmar senha/i)).toHaveAttribute('type', 'password');
  });

  it('não expõe dados do usuário convidado no erro', async () => {
    mockValidate.mockResolvedValue({ valid: false, error: 'Convite inválido, expirado ou já utilizado.' });
    render(<ConvitePage token="tok-bad" />);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).not.toMatch(/e-mail/i);
      expect(alert.textContent).not.toMatch(/usuário/i);
    });
  });
});
