'use client';

import { useState, useTransition } from 'react';
import { loginLocal } from '../../lib/auth-api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await loginLocal(email, password);
      if (result.ok) {
        window.location.href = '/app';
      } else {
        setError(result.error ?? 'Erro desconhecido.');
      }
    });
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Acesso à plataforma</h1>
          <p>Informe suas credenciais para continuar.</p>
        </header>

        <form aria-label="Formulário de login" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">E-mail</label>
            <input
              autoComplete="email"
              disabled={isPending}
              id="login-email"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">Senha</label>
            <input
              autoComplete="current-password"
              disabled={isPending}
              id="login-password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error && (
            <p aria-live="polite" className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="btn-primary" disabled={isPending} type="submit">
            {isPending ? 'Aguarde…' : 'Entrar'}
          </button>
        </form>

        <footer className="auth-footer">
          <a href="/convite">Ativar conta por convite</a>
        </footer>
      </div>
    </main>
  );
}
