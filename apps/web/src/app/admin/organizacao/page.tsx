import { getOrgClients, getOrgSectors, getOrgProjects } from '../../lib/org-api';
import type { OrgClientView, OrgSectorView, OrgProjectView } from '@heimdall/contracts';
import { OrganizationActions } from './organization-actions';

function StatusBadge({ status }: { status: string }) {
  const label = status === 'active' ? 'Ativo' : status === 'archived' ? 'Arquivado' : 'Excluído';
  return <span className={`status-badge status-${status}`}>{label}</span>;
}

function ClientTable({ clients }: { clients: OrgClientView[] }) {
  if (clients.length === 0) {
    return <p className="empty-state">Nenhum cliente cadastrado.</p>;
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Status</th>
          <th>Criado em</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((c) => (
          <tr key={c.id}>
            <td>{c.name}</td>
            <td>
              <StatusBadge status={c.status} />
            </td>
            <td>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SectorTable({ sectors }: { sectors: OrgSectorView[] }) {
  if (sectors.length === 0) {
    return <p className="empty-state">Nenhum setor cadastrado.</p>;
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Status</th>
          <th>Criado em</th>
        </tr>
      </thead>
      <tbody>
        {sectors.map((s) => (
          <tr key={s.id}>
            <td>{s.name}</td>
            <td>
              <StatusBadge status={s.status} />
            </td>
            <td>{new Date(s.createdAt).toLocaleDateString('pt-BR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProjectTable({ projects }: { projects: OrgProjectView[] }) {
  if (projects.length === 0) {
    return <p className="empty-state">Nenhum projeto cadastrado.</p>;
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Status</th>
          <th>Criado em</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>
              <StatusBadge status={p.status} />
            </td>
            <td>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function AdminOrganizacaoPage() {
  const [clients, sectors, projects] = await Promise.all([
    getOrgClients(),
    getOrgSectors(),
    getOrgProjects(),
  ]);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Estrutura organizacional</h1>
        <p>Gerencie clientes, setores e projetos da plataforma.</p>
      </header>

      <OrganizationActions clients={clients} sectors={sectors} />

      <section aria-labelledby="clients-heading" className="admin-section">
        <h2 id="clients-heading">Clientes</h2>
        <ClientTable clients={clients} />
      </section>

      <section aria-labelledby="sectors-heading" className="admin-section">
        <h2 id="sectors-heading">Setores</h2>
        <SectorTable sectors={sectors} />
      </section>

      <section aria-labelledby="projects-heading" className="admin-section">
        <h2 id="projects-heading">Projetos</h2>
        <ProjectTable projects={projects} />
      </section>
    </main>
  );
}
