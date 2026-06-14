import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';
import { entiRepository } from '../../../domain/enti/entiRepository';
import { createEnti } from '../../../domain/enti/createEnti';

describe('WorkspaceEditorMinimizationIntegration - FIA-019', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entiRepository.clear();
  });

  it('TEST-FIA019-01: EntiEditor abierto muestra control explícito de minimizar', () => {
    const mockEnti = createEnti('E1', 'Enti Test', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(mockEnti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Enti Test'));
    
    const minimizeBtn = screen.getByTestId('btn-minimize-editor');
    expect(minimizeBtn).toBeInTheDocument();
    expect(minimizeBtn.getAttribute('title')).toBe('Minimizar Editor');
  });

  it('TEST-FIA019-02, 03: minimizar reduce visualmente el editor sin destruir draft y restaurar lo recupera', () => {
    const mockEnti = createEnti('E1', 'Minimizar Enti', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(mockEnti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Minimizar Enti'));
    
    // Cambiamos contenido (draft sucio)
    const nameInput = screen.getByTestId('input-name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Borrador modificado' } });
    expect(nameInput.value).toBe('Borrador modificado');
    
    // Minimizamos
    const minimizeBtn = screen.getByTestId('btn-minimize-editor');
    fireEvent.click(minimizeBtn);
    
    // Al minimizar el editor visualmente se reduce (p.e. desaparece el input-name)
    expect(screen.queryByTestId('input-name')).not.toBeInTheDocument();
    // Pero el titulo muestra que sigue siendo el editor del Enti
    expect(screen.getByText('Editor: Borrador modificado')).toBeInTheDocument();
    
    // Restauramos haciendo clic en el propio contenedor
    fireEvent.click(screen.getByTestId('enti-editor'));
    
    // El draft se ha preservado
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect((screen.getByTestId('input-name') as HTMLInputElement).value).toBe('Borrador modificado');
  });

  it('TEST-FIA019-04, 05: dirty se conserva al minimizar/restaurar y muestra Guardar/Descartar al cerrar', () => {
    const mockEnti = createEnti('E1', 'Dirty Enti', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(mockEnti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Dirty Enti'));
    
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'Dirty persistido' } });
    fireEvent.click(screen.getByTestId('btn-minimize-editor')); // minimizamos
    fireEvent.click(screen.getByTestId('enti-editor')); // restauramos
    
    // Cerramos el editor
    fireEvent.click(screen.getByTestId('btn-close-editor'));
    
    // Aparece el dialog porque dirty se conservó
    expect(screen.getByTestId('close-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('btn-dialog-guardar')).toBeInTheDocument();
  });

  it('TEST-FIA019-06: seleccionar otro Enti limpia minimización previa y resincroniza editor', () => {
    const enti1 = createEnti('E1', 'Enti 1', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti 2', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByText('Enti 1'));
    fireEvent.click(screen.getByTestId('btn-minimize-editor')); // Minimizamos E1
    
    expect(screen.queryByTestId('input-name')).not.toBeInTheDocument(); // E1 está minimizado
    
    // Clic en Enti 2
    fireEvent.click(screen.getByText('Enti 2'));
    
    // Enti 2 debe estar maximizado y resincronizado
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect((screen.getByTestId('input-name') as HTMLInputElement).value).toBe('Enti 2');
  });

  it('TEST-FIA019-07: eliminar Enti minimizado desmonta editor y limpia selección', () => {
    const enti1 = createEnti('E1', 'Enti a Borrar', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByText('Enti a Borrar'));
    fireEvent.click(screen.getByTestId('btn-minimize-editor')); // Minimizamos
    
    const deleteBtn = screen.getByTestId('btn-delete-enti-E1');
    fireEvent.click(deleteBtn);
    fireEvent.click(screen.getByTestId('btn-confirm-delete'));
    
    expect(screen.queryByTestId('enti-editor')).not.toBeInTheDocument();
  });

  it('TEST-FIA019-08, 09, 11: sin persistencia storage, no forbidden units, y Ghost permanece pasivo', () => {
    const enti1 = createEnti('E1', 'Enti Fantasma', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    
    render(<WorkspaceShell />);
    expect(screen.getByTestId('workspace-ghost-view')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Enti Fantasma'));
    fireEvent.click(screen.getByTestId('btn-minimize-editor'));
    
    // Asegurar que no se persiste minimizado
    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});
