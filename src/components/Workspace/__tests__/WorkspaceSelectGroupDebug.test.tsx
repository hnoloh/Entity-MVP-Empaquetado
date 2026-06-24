import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';

describe('WorkspaceSelectGroupDebug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Debe abrir el GroupEditor al clicar el grupo guardado', async () => {
    render(<WorkspaceShell />);
    
    // Crear Enti 1
    fireEvent.click(screen.getByTestId('btn-create-enti'));
    fireEvent.change(screen.getAllByTestId('input-name')[0], { target: { value: 'Enti 1' } });
    fireEvent.change(screen.getAllByTestId('input-function')[0], { target: { value: 'Función de Enti 1' } });
    // Guardar Enti 1
    act(() => {
      window.dispatchEvent(new CustomEvent('request-close-editor', { detail: { id: screen.getAllByTestId(/^tab-item-enti-/)[0].dataset.testid?.replace('tab-item-', '') } }));
    });
    fireEvent.click(screen.getByTestId('btn-dialog-guardar'));

    // Crear Enti 2
    fireEvent.click(screen.getByTestId('btn-create-enti'));
    fireEvent.change(screen.getAllByTestId('input-name')[0], { target: { value: 'Enti 2' } });
    fireEvent.change(screen.getAllByTestId('input-function')[0], { target: { value: 'Función de Enti 2' } });
    // Guardar Enti 2
    act(() => {
      window.dispatchEvent(new CustomEvent('request-close-editor', { detail: { id: screen.getAllByTestId(/^tab-item-enti-/)[0].dataset.testid?.replace('tab-item-', '') } }));
    });
    fireEvent.click(screen.getByTestId('btn-dialog-guardar'));

    // Crear grupo
    const btnCreateGrupo = screen.getByTestId('btn-create-grupo');
    fireEvent.click(btnCreateGrupo);
    
    expect(screen.getByTestId('group-editor')).toBeInTheDocument();
    
    // Cambiar nombre y función
    fireEvent.change(screen.getByTestId('input-group-name'), { target: { value: 'Test Group' } });
    fireEvent.change(screen.getByTestId('input-group-function'), { target: { value: 'Test Function' } });
    
    // Asignar entis
    const enti1Item = screen.getAllByTestId(/^enti-item-/)[0];
    const enti2Item = screen.getAllByTestId(/^enti-item-/)[1];
    
    const enti1Id = enti1Item.dataset.testid!.replace('enti-item-', '');
    const enti2Id = enti2Item.dataset.testid!.replace('enti-item-', '');

    const createDataTransfer = (id: string) => ({
      types: ['application/x-enti-id'],
      getData: (format: string) => format === 'application/x-enti-id' ? id : ''
    });

    fireEvent.drop(screen.getByTestId('slot-dropzone-1'), {
      dataTransfer: createDataTransfer(enti1Id)
    });
    
    fireEvent.drop(screen.getByTestId('slot-dropzone-2'), {
      dataTransfer: createDataTransfer(enti2Id)
    });

    // Cerrar y guardar grupo
    act(() => {
      window.dispatchEvent(new CustomEvent('request-close-editor', { detail: { id: screen.getAllByTestId(/^tab-item-grupo-/)[0].dataset.testid?.replace('tab-item-', '') } }));
    });
    fireEvent.click(screen.getByTestId('btn-dialog-guardar'));

    // Debe estar en el sidebar
    const groupItems = screen.getAllByTestId(/^grupo-item-/);
    expect(groupItems.length).toBe(1);

    // Clicar en el sidebar
    fireEvent.click(groupItems[0]);

    // Verificar si se abrió el editor
    const groupEditor = screen.getByTestId('group-editor');
    expect(groupEditor).toBeInTheDocument();
    expect(groupEditor).not.toHaveClass('hidden');
  });
});
