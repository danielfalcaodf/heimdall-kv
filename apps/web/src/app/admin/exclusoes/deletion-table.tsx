'use client';

import { useState, useTransition } from 'react';

interface DeletionItem {
  id: string;
  name: string;
  type: 'client' | 'sector' | 'project';
  status: 'active' | 'archived';
}

interface Props {
  items: DeletionItem[];
}

const TYPE_LABEL: Record<DeletionItem['type'], string> = {
  client: 'Cliente',
  sector: 'Setor',
  project: 'Projeto',
};

function DeletionRow({ item }: { item: DeletionItem }) {
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 300));
      setDone(true);
    });
  }

  if (done) {
    return (
      <tr>
        <td>{item.name}</td>
        <td>{TYPE_LABEL[item.type]}</td>
        <td colSpan={2}>
          <span className="status-badge status-deleted">Excluído definitivamente</span>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{item.name}</td>
      <td>{TYPE_LABEL[item.type]}</td>
      <td>{item.status === 'archived' ? 'Arquivado' : 'Ativo'}</td>
      <td>
        {item.status !== 'archived' ? (
          <span className="hint">Arquive antes de excluir definitivamente.</span>
        ) : !confirmed ? (
          <button
            className="btn-danger-outline"
            onClick={() => setConfirmed(true)}
            type="button"
          >
            Excluir definitivamente
          </button>
        ) : (
          <div className="confirm-inline">
            <span>Confirmar exclusão de &ldquo;{item.name}&rdquo;?</span>
            <button
              className="btn-danger"
              disabled={isPending}
              onClick={handleConfirm}
              type="button"
            >
              {isPending ? 'Excluindo…' : 'Confirmar'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setConfirmed(false)}
              type="button"
            >
              Cancelar
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export function DeletionTable({ items }: Props) {
  if (items.length === 0) {
    return <p className="empty-state">Nenhum item disponível para exclusão.</p>;
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Tipo</th>
          <th>Status</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <DeletionRow item={item} key={item.id} />
        ))}
      </tbody>
    </table>
  );
}
