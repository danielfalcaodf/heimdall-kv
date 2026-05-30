import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeletionTable } from './deletion-table';

describe('DeletionTable', () => {
  it('exibe estado vazio quando não há itens', () => {
    render(<DeletionTable items={[]} />);
    expect(screen.getByText(/nenhum item/i)).toBeInTheDocument();
  });

  it('exibe item ativo com instrução de arquivar antes de excluir', () => {
    render(
      <DeletionTable
        items={[{ id: 'c1', name: 'Cliente Alpha', type: 'client', status: 'active' }]}
      />,
    );
    expect(screen.getByText('Cliente Alpha')).toBeInTheDocument();
    expect(screen.getByText(/arquive antes/i)).toBeInTheDocument();
  });

  it('exibe botão de exclusão para item arquivado', () => {
    render(
      <DeletionTable
        items={[{ id: 'c1', name: 'Cliente Beta', type: 'client', status: 'archived' }]}
      />,
    );
    expect(screen.getByRole('button', { name: /excluir definitivamente/i })).toBeInTheDocument();
  });

  it('exibe confirmação após clicar em excluir definitivamente', async () => {
    render(
      <DeletionTable
        items={[{ id: 'c1', name: 'Cliente Gamma', type: 'client', status: 'archived' }]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /excluir definitivamente/i }));

    await waitFor(() => {
      expect(screen.getByText(/confirmar exclusão/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });
  });

  it('cancela e volta ao estado inicial', async () => {
    render(
      <DeletionTable
        items={[{ id: 'c1', name: 'Cliente Delta', type: 'client', status: 'archived' }]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /excluir definitivamente/i }));
    await waitFor(() => screen.getByRole('button', { name: /cancelar/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /excluir definitivamente/i })).toBeInTheDocument();
    });
  });
});
