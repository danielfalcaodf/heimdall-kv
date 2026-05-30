import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import * as authApi from '../../lib/auth-api';

jest.mock('../../lib/auth-api');

const mockLoginLocal = authApi.loginLocal as jest.MockedFunction<typeof authApi.loginLocal>;

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza o formulário de login', () => {
    mockLoginLocal.mockResolvedValue({ ok: true });
    render(<LoginPage />);

    expect(screen.getByRole('form', { name: /formulário de login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('exibe erro genérico em falha de login', async () => {
    mockLoginLocal.mockResolvedValue({ ok: false, error: 'Credenciais inválidas ou acesso não autorizado.' });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Credenciais inválidas ou acesso não autorizado.');
    });
  });

  it('não revela se o e-mail existe na mensagem de erro', async () => {
    mockLoginLocal.mockResolvedValue({ ok: false, error: 'Credenciais inválidas ou acesso não autorizado.' });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'unknown@test.com' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'anything' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).not.toMatch(/usuário não encontrado/i);
      expect(alert.textContent).not.toMatch(/e-mail não cadastrado/i);
      expect(alert.textContent).not.toMatch(/não existe/i);
    });
  });

  it('desabilita o botão durante o carregamento', async () => {
    mockLoginLocal.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100)));
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('nunca passa senha como texto visível no DOM', () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/senha/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
