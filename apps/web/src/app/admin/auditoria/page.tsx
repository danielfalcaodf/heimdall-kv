import { getAuditEvents } from '../../lib/admin-api';
import type { AuditEventView } from '@heimdall/contracts';

const RESULT_LABEL: Record<string, string> = {
  success: 'Sucesso',
  denied: 'Negado',
  error: 'Erro',
};

function AuditRow({ event }: { event: AuditEventView }) {
  return (
    <tr>
      <td>{new Date(event.createdAt).toLocaleString('pt-BR')}</td>
      <td>{event.actorUserId}</td>
      <td>{event.action}</td>
      <td>{event.resourceType}</td>
      <td>
        <span className={`result-badge result-${event.result}`}>
          {RESULT_LABEL[event.result] ?? event.result}
        </span>
      </td>
    </tr>
  );
}

export default async function AdminAuditoriaPage() {
  const events = await getAuditEvents();

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Auditoria operacional</h1>
        <p>Consulte eventos de autenticação, administração e operações críticas.</p>
      </header>

      <section aria-labelledby="audit-heading" className="admin-section">
        <h2 id="audit-heading">Eventos recentes</h2>

        {events.length === 0 ? (
          <p className="empty-state">Nenhum evento de auditoria registrado.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Data/hora</th>
                <th>Ator</th>
                <th>Ação</th>
                <th>Recurso</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <AuditRow event={e} key={e.id} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
