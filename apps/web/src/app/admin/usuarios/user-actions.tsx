'use client';

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import type { OrgUserBindingView, OrgUserProfileView } from '@heimdall/contracts';
import { createInvite } from '../../lib/auth-api';
import {
  createOrgBinding,
  createOrgUserProfile,
  reactivateOrgUserProfile,
  revokeOrgBinding,
  suspendOrgUserProfile,
} from '../../lib/org-api';

interface Props {
  users: OrgUserProfileView[];
  bindings: OrgUserBindingView[];
}

export function UserAdminActions({ users, bindings }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(form: HTMLFormElement, action: () => Promise<unknown>, success: string) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await action();
      const succeeded =
        typeof result === 'object' && result !== null && 'ok' in result
          ? (result as { ok?: boolean }).ok !== false
          : Boolean(result);
      if (succeeded) {
        form.reset();
        setMessage(success);
      } else {
        setError('Não foi possível concluir a ação.');
      }
    });
  }

  function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') ?? '').trim();
    const displayName = String(data.get('displayName') ?? '').trim() || undefined;
    const role = String(data.get('inviteRole') ?? 'viewer') as 'viewer' | 'editor' | 'administrator';
    runAction(form, () => createInvite(email, role, displayName), 'Convite criado.');
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const userId = String(data.get('profileUserId') ?? '').trim();
    const role = String(data.get('profileRole') ?? 'viewer') as 'viewer' | 'editor' | 'admin';
    runAction(form, () => createOrgUserProfile({ userId, role }), 'Perfil criado.');
  }

  function runProfileStatus(form: HTMLFormElement, mode: 'suspend' | 'reactivate') {
    const data = new FormData(form);
    const profileId = String(data.get('profileId') ?? '');
    runAction(
      form,
      () => mode === 'suspend' ? suspendOrgUserProfile(profileId) : reactivateOrgUserProfile(profileId),
      mode === 'suspend' ? 'Usuário suspenso.' : 'Usuário reativado.',
    );
  }

  function handleProfileStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runProfileStatus(event.currentTarget, 'suspend');
  }

  function handleBindingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const userId = String(data.get('bindingUserId') ?? '').trim();
    const role = String(data.get('bindingRole') ?? 'viewer') as 'viewer' | 'editor' | 'admin';
    const projectId = String(data.get('projectId') ?? '').trim();
    const hasVaultAccess = data.get('hasVaultAccess') === 'on';
    runAction(
      form,
      () => createOrgBinding({ userId, role, projectId: projectId || undefined, hasVaultAccess }),
      'Vínculo criado.',
    );
  }

  function handleBindingRevoke(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const bindingId = String(data.get('bindingId') ?? '');
    runAction(form, () => revokeOrgBinding(bindingId), 'Vínculo revogado.');
  }

  return (
    <section aria-labelledby="user-actions-heading" className="admin-section">
      <h2 id="user-actions-heading">Operações</h2>

      <div className="admin-action-grid">
        <form aria-label="Criar convite" className="admin-form" onSubmit={handleInviteSubmit}>
          <label htmlFor="invite-email">E-mail</label>
          <input autoComplete="email" disabled={isPending} id="invite-email" name="email" required type="email" />
          <label htmlFor="invite-display-name">Nome</label>
          <input disabled={isPending} id="invite-display-name" name="displayName" />
          <label htmlFor="invite-role">Perfil</label>
          <select disabled={isPending} id="invite-role" name="inviteRole">
            <option value="viewer">Visualizador</option>
            <option value="editor">Editor</option>
            <option value="administrator">Administrador</option>
          </select>
          <button className="btn-primary" disabled={isPending} type="submit">
            Criar convite
          </button>
        </form>

        <form aria-label="Criar perfil" className="admin-form" onSubmit={handleProfileSubmit}>
          <label htmlFor="profile-user-id">ID de usuário</label>
          <input disabled={isPending} id="profile-user-id" name="profileUserId" required />
          <label htmlFor="profile-role">Papel</label>
          <select disabled={isPending} id="profile-role" name="profileRole">
            <option value="viewer">Visualizador</option>
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </select>
          <button className="btn-primary" disabled={isPending} type="submit">
            Criar perfil
          </button>
        </form>

        <form
          aria-label="Alterar status do usuário"
          className="admin-form"
          onSubmit={handleProfileStatusSubmit}
        >
          <label htmlFor="status-profile">Perfil</label>
          <select disabled={isPending || users.length === 0} id="status-profile" name="profileId" required>
            <option value="">Selecione</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.userId}
              </option>
            ))}
          </select>
          <div className="button-row">
            <button className="btn-danger-outline" disabled={isPending || users.length === 0} type="submit">
              Suspender
            </button>
            <button
              className="btn-secondary"
              disabled={isPending || users.length === 0}
              onClick={(event) => {
                if (event.currentTarget.form) {
                  runProfileStatus(event.currentTarget.form, 'reactivate');
                }
              }}
              type="button"
            >
              Reativar
            </button>
          </div>
        </form>

        <form aria-label="Criar vínculo" className="admin-form" onSubmit={handleBindingSubmit}>
          <label htmlFor="binding-user-id">ID de usuário</label>
          <input disabled={isPending} id="binding-user-id" name="bindingUserId" required />
          <label htmlFor="binding-project-id">ID de projeto</label>
          <input disabled={isPending} id="binding-project-id" name="projectId" />
          <label htmlFor="binding-role">Papel</label>
          <select disabled={isPending} id="binding-role" name="bindingRole">
            <option value="viewer">Visualizador</option>
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </select>
          <label className="checkbox-field" htmlFor="binding-vault">
            <input disabled={isPending} id="binding-vault" name="hasVaultAccess" type="checkbox" />
            Vault
          </label>
          <button className="btn-primary" disabled={isPending} type="submit">
            Criar vínculo
          </button>
        </form>

        <form aria-label="Revogar vínculo" className="admin-form" onSubmit={handleBindingRevoke}>
          <label htmlFor="binding-id">Vínculo</label>
          <select disabled={isPending || bindings.length === 0} id="binding-id" name="bindingId" required>
            <option value="">Selecione</option>
            {bindings.map((binding) => (
              <option key={binding.id} value={binding.id}>
                {binding.userId} / {binding.projectId ?? 'global'}
              </option>
            ))}
          </select>
          <button className="btn-danger-outline" disabled={isPending || bindings.length === 0} type="submit">
            Revogar vínculo
          </button>
        </form>
      </div>

      {message && <p className="success-message" role="status">{message}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </section>
  );
}
