import type { BootstrapResponse, HealthResponse, OperationalStatus } from '@heimdall/contracts';

const statusLabel: Record<OperationalStatus, string> = {
  operational: 'Operacional',
  degraded: 'Degradado',
  unavailable: 'Indisponivel',
  unknown: 'Desconhecido',
};

function StatusBadge({ status, denied }: { status: OperationalStatus; denied?: boolean }) {
  return (
    <span className={`badge ${denied ? 'denied' : status}`}>
      {denied ? 'Sem acesso' : statusLabel[status]}
    </span>
  );
}

export function AppShell({ bootstrap }: { bootstrap: BootstrapResponse }) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Heimdall KV</strong>
          <span>Base de conhecimento</span>
        </div>

        <nav className="nav-list" aria-label="Modulos">
          {bootstrap.modules.map((module) => (
            <a
              aria-disabled={!module.allowed}
              className="nav-item"
              href={module.allowed ? module.href : '/app/sem-acesso'}
              key={module.id}
            >
              {module.label}
              <StatusBadge denied={!module.allowed} status={module.status} />
            </a>
          ))}
        </nav>

        <div className="scope">
          <span>Projeto ativo</span>
          <strong>{bootstrap.activeScope.projectName}</strong>
          <span>{bootstrap.activeScope.clientName}</span>
        </div>
      </aside>

      <section className="shell-main">
        <header className="topbar">
          <div>
            <div className="breadcrumbs">Inicio / App</div>
            <strong>{bootstrap.activeScope.projectName}</strong>
          </div>
          <div className="user-block">
            <strong>{bootstrap.user.displayName}</strong>
            <span>{bootstrap.user.role}</span>
          </div>
        </header>

        <div className="content">
          <section className="section">
            <h1>Operacao do conhecimento</h1>
            <div className="metric-row">
              <div className="metric">
                <strong>{bootstrap.modules.length}</strong>
                <span>modulos no shell</span>
              </div>
              <div className="metric">
                <strong>{bootstrap.worker.queueName}</strong>
                <span>fila de sanidade</span>
              </div>
              <div className="metric">
                <strong>{new Date(bootstrap.checkedAt).toLocaleString('pt-BR')}</strong>
                <span>ultima verificacao</span>
              </div>
            </div>
          </section>

          <section className="section">
            <h2>Modulos</h2>
            <div className="module-grid">
              {bootstrap.modules.map((module) => (
                <article className="module-row" key={module.id}>
                  <div className="row-heading">
                    <strong>{module.label}</strong>
                    <StatusBadge denied={!module.allowed} status={module.status} />
                  </div>
                  <span>
                    {module.allowed
                      ? 'Disponivel no escopo ativo.'
                      : 'Bloqueado para o perfil atual.'}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <GlobalStates />
        </div>
      </section>
    </main>
  );
}

export function GlobalStates() {
  const states = [
    { name: 'Loading', action: 'Aguardar' },
    { name: 'Empty', action: 'Voltar' },
    { name: 'Error', action: 'Tentar novamente' },
    { name: 'Success', action: 'Continuar' },
    { name: 'Permission denied', action: 'Voltar ao app' },
  ];

  return (
    <section className="section">
      <h2>Estados globais</h2>
      <div className="state-grid">
        {states.map((state) => (
          <div className="state-panel" key={state.name}>
            <strong>{state.name}</strong>
            <p>Mensagem segura e reutilizavel.</p>
            <a href="/app">{state.action}</a>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PermissionDeniedState() {
  return (
    <main className="state-page">
      <section className="section">
        <div className="breadcrumbs">Inicio / Sem acesso</div>
        <h1>Acesso nao autorizado</h1>
        <p>O recurso nao esta disponivel para o perfil atual.</p>
        <a href="/app">Voltar ao app</a>
      </section>
    </main>
  );
}

export function HealthStatusView({
  health,
  isAdmin,
  statusFilter = 'all',
}: {
  health: HealthResponse;
  isAdmin: boolean;
  statusFilter?: OperationalStatus | 'all';
}) {
  if (!isAdmin) {
    return <PermissionDeniedState />;
  }

  const dependencies =
    statusFilter === 'all'
      ? health.dependencies
      : health.dependencies.filter((dependency) => dependency.status === statusFilter);
  const filters: Array<{ label: string; value: OperationalStatus | 'all' }> = [
    { label: 'Todos', value: 'all' },
    { label: 'Operacional', value: 'operational' },
    { label: 'Degradado', value: 'degraded' },
    { label: 'Indisponivel', value: 'unavailable' },
    { label: 'Desconhecido', value: 'unknown' },
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Heimdall KV</strong>
          <span>Administracao</span>
        </div>
        <nav className="nav-list" aria-label="Administracao">
          <a className="nav-item" href="/app">
            App
            <span />
          </a>
          <a className="nav-item" href="/admin/status">
            Status operacional
            <StatusBadge status={health.status} />
          </a>
        </nav>
      </aside>

      <section className="shell-main">
        <header className="topbar">
          <div>
            <div className="breadcrumbs">Admin / Status</div>
            <strong>Status operacional</strong>
          </div>
          <StatusBadge status={health.status} />
        </header>

        <div className="content">
          <section className="section">
            <h1>Dependencias essenciais</h1>
            <p>Ultima verificacao: {new Date(health.checkedAt).toLocaleString('pt-BR')}</p>
            <div className="filter-row" aria-label="Filtro de status">
              {filters.map((filter) => (
                <a
                  className={filter.value === statusFilter ? 'filter-link active' : 'filter-link'}
                  href={
                    filter.value === 'all'
                      ? '/admin/status'
                      : `/admin/status?status=${filter.value}`
                  }
                  key={filter.value}
                >
                  {filter.label}
                </a>
              ))}
            </div>
            <div className="health-grid">
              {dependencies.map((dependency) => (
                <article className="health-row" key={dependency.id}>
                  <div className="row-heading">
                    <strong>{dependency.label}</strong>
                    <StatusBadge status={dependency.status} />
                  </div>
                  <p>{dependency.message}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
