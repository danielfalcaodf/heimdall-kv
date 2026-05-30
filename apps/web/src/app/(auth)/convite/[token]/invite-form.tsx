'use client';

import { useEffect, useState, useTransition } from 'react';
import { validateInviteToken, acceptInvite } from '../../../lib/auth-api';

interface Props {
  token: string;
}

function InviteForm({ token }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password !== confirm) {
      setFormError('As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setFormError('A senha deve ter ao menos 8 caracteres.');
      return;
    }

    startTransition(async () => {
      const result = await acceptInvite(token, password);
      if (result.ok) {
        window.location.href = '/app';
      } else {
        setFormError(result.error ?? 'Erro ao ativar conta.');
      }
    });
  }

  return (
    <form aria-label="Formulário de aceite de convite" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="invite-password">Senha inicial</label>
        <input
          autoComplete="new-password"
          disabled={isPending}
          id="invite-password"
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          value={password}
        />
      </div>

      <div className="field">
        <label htmlFor="invite-confirm">Confirmar senha</label>
        <input
          autoComplete="new-password"
          disabled={isPending}
          id="invite-confirm"
          minLength={8}
          onChange={(e) => setConfirm(e.target.value)}
          required
          type="password"
          value={confirm}
        />
      </div>

      {formError && (
        <p aria-live="polite" className="auth-error" role="alert">
          {formError}
        </p>
      )}

      <button className="btn-primary" disabled={isPending} type="submit">
        {isPending ? 'Ativando…' : 'Ativar conta'}
      </button>
    </form>
  );
}

export default function ConvitePage({ token }: Props) {
  const [state, setState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateInviteToken(token).then((result) => {
      if (result.valid) {
        setState('valid');
      } else {
        setState('invalid');
        setError(result.error ?? 'Convite inválido.');
      }
    });
  }, [token]);

  if (state === 'loading') {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <p aria-live="polite">Validando convite…</p>
        </div>
      </main>
    );
  }

  if (state === 'invalid') {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <header className="auth-header">
            <h1>Convite inválido</h1>
          </header>
          <p aria-live="polite" className="auth-error" role="alert">
            {error}
          </p>
          <a href="/login">Voltar ao login</a>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Ativar conta</h1>
          <p>Defina sua senha para concluir o cadastro.</p>
        </header>
        <InviteForm token={token} />
      </div>
    </main>
  );
}
