'use client';

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import type { OrgClientView, OrgSectorView } from '@heimdall/contracts';
import { createOrgClient, createOrgProject, createOrgSector } from '../../lib/org-api';

interface Props {
  clients: OrgClientView[];
  sectors: OrgSectorView[];
}

export function OrganizationActions({ clients, sectors }: Props) {
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

  function handleClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('clientName') ?? '').trim();
    runAction(form, () => createOrgClient({ name }), 'Cliente criado.');
  }

  function handleSectorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('sectorName') ?? '').trim();
    const clientId = String(data.get('sectorClientId') ?? '');
    runAction(form, () => createOrgSector({ name, clientId }), 'Setor criado.');
  }

  function handleProjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('projectName') ?? '').trim();
    const clientId = String(data.get('projectClientId') ?? '');
    const sectorId = String(data.get('projectSectorId') ?? '');
    runAction(
      form,
      () => createOrgProject({ name, clientId, sectorId: sectorId || undefined }),
      'Projeto criado.',
    );
  }

  return (
    <section aria-labelledby="org-actions-heading" className="admin-section">
      <h2 id="org-actions-heading">Cadastro</h2>

      <div className="admin-action-grid">
        <form aria-label="Criar cliente" className="admin-form" onSubmit={handleClientSubmit}>
          <label htmlFor="client-name">Cliente</label>
          <input disabled={isPending} id="client-name" name="clientName" required />
          <button className="btn-primary" disabled={isPending} type="submit">
            Criar cliente
          </button>
        </form>

        <form aria-label="Criar setor" className="admin-form" onSubmit={handleSectorSubmit}>
          <label htmlFor="sector-name">Setor</label>
          <input disabled={isPending || clients.length === 0} id="sector-name" name="sectorName" required />
          <label htmlFor="sector-client">Cliente</label>
          <select disabled={isPending || clients.length === 0} id="sector-client" name="sectorClientId" required>
            <option value="">Selecione</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <button className="btn-primary" disabled={isPending || clients.length === 0} type="submit">
            Criar setor
          </button>
        </form>

        <form aria-label="Criar projeto" className="admin-form" onSubmit={handleProjectSubmit}>
          <label htmlFor="project-name">Projeto</label>
          <input disabled={isPending || clients.length === 0} id="project-name" name="projectName" required />
          <label htmlFor="project-client">Cliente</label>
          <select disabled={isPending || clients.length === 0} id="project-client" name="projectClientId" required>
            <option value="">Selecione</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <label htmlFor="project-sector">Setor</label>
          <select disabled={isPending} id="project-sector" name="projectSectorId">
            <option value="">Sem setor</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
          <button className="btn-primary" disabled={isPending || clients.length === 0} type="submit">
            Criar projeto
          </button>
        </form>
      </div>

      {message && <p className="success-message" role="status">{message}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </section>
  );
}
