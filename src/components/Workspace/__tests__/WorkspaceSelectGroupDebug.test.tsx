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
    fireEvent.click(screen.getByTestId('select-slot-1'));
    fireEvent.click(screen.getByText('Enti 1', { selector: 'li' }));
    
    fireEvent.click(screen.getByTestId('select-slot-2'));
    fireEvent.click(screen.getByText('Enti 2', { selector: 'li' }));

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
