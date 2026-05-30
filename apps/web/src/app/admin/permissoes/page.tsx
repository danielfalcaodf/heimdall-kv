import { getPermissions } from '../../lib/admin-api';
import type { OrgUserBindingView } from '@heimdall/contracts';

function BindingRow({ binding }: { binding: OrgUserBindingView }) {
  return (
    <tr>
      <td>{binding.userId}</td>
      <td>{binding.projectId ?? '—'}</td>
      <td>{binding.role}</td>
      <td>
        <span className={binding.hasVaultAccess ? 'vault-yes' : 'vault-no'}>
          {binding.hasVaultAccess ? 'Sim' : 'Não'}
        </span>
      </td>
      <td>{binding.revokedAt ? 'Revogado' : 'Ativo'}</td>
    </tr>
  );
}

export default async function AdminPermissoesPage() {
  const bindings = await getPermissions();

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Permissões por projeto e vault</h1>
        <p>Visualize e gerencie vínculos de usuário com projetos e permissões de vault.</p>
      </header>

      <section aria-labelledby="perms-heading" className="admin-section">
        <h2 id="perms-heading">Vínculos ativos</h2>

        {bindings.length === 0 ? (
          <p className="empty-state">Nenhum vínculo configurado.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Projeto</th>
                <th>Papel</th>
                <th>Vault</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {bindings.map((b) => (
                <BindingRow binding={b} key={b.id} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
