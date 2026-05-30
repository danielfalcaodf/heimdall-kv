import { getOrgBindings, getOrgUsers } from '../../lib/org-api';
import type { OrgUserProfileView } from '@heimdall/contracts';
import { UserAdminActions } from './user-actions';

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    active: 'Ativo',
    suspended: 'Suspenso',
    removed: 'Removido',
  };
  return <span className={`status-badge status-${status}`}>{labels[status] ?? status}</span>;
}

function RoleBadge({ role }: { role: string }) {
  const labels: Record<string, string> = {
    viewer: 'Visualizador',
    editor: 'Editor',
    admin: 'Administrador',
  };
  return <span className={`role-badge role-${role}`}>{labels[role] ?? role}</span>;
}

function UserTable({ users }: { users: OrgUserProfileView[] }) {
  if (users.length === 0) {
    return <p className="empty-state">Nenhum usuário cadastrado.</p>;
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>ID de usuário</th>
          <th>Papel</th>
          <th>Status</th>
          <th>Desde</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <td>{u.userId}</td>
            <td>
              <RoleBadge role={u.role} />
            </td>
            <td>
              <StatusBadge status={u.status} />
            </td>
            <td>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function AdminUsuariosPage() {
  const [users, bindings] = await Promise.all([getOrgUsers(), getOrgBindings()]);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Usuários e perfis</h1>
        <p>Gerencie usuários, papéis e vínculos organizacionais.</p>
      </header>

      <UserAdminActions bindings={bindings} users={users} />

      <section aria-labelledby="users-heading" className="admin-section">
        <h2 id="users-heading">Perfis de usuário</h2>
        <UserTable users={users} />
      </section>
    </main>
  );
}
