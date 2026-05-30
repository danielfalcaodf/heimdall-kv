import { DeletionTable } from './deletion-table';

export default async function AdminExclusoesPage() {
  // In V1, deletion items are fetched from API — mocked as empty for now.
  // Guards on the API enforce that only admins can act on archived resources.
  const items: Parameters<typeof DeletionTable>[0]['items'] = [];

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Exclusão definitiva</h1>
        <p>
          Somente recursos arquivados podem ser excluídos permanentemente. Esta ação é
          irreversível.
        </p>
      </header>

      <section aria-labelledby="deletion-heading" className="admin-section">
        <h2 id="deletion-heading">Itens disponíveis para exclusão</h2>
        <DeletionTable items={items} />
      </section>
    </main>
  );
}
