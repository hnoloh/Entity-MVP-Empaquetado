import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';
import { entiRepository } from '../../../domain/enti/entiRepository';
import { createEnti } from '../../../domain/enti/createEnti';

describe('WorkspaceDiscardChangesIntegration - FIA-024', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entiRepository.clear();
  });

  it('TEST-FIA024-01, 02: Descartar no llama a save/update, restaura estado guardado y cierra editor', () => {
    const enti1 = createEnti('E1', 'Enti Original', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    
    // Abrir Enti
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    
    // Modificar nombre
    const inputName = screen.getByTestId('input-name') as HTMLInputElement;
    fireEvent.change(inputName, { target: { value: 'Enti Editado' } });
    
    // Intentar cerrar (aparece minimenu)
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Descartar cambios
    fireEvent.click(screen.getByTestId('btn-dialog-descartar'));
    
    // Verificar que NO se guardó en repo
    const repoEnti = entiRepository.getById('E1');
    expect(repoEnti?.name).toBe('Enti Original');
    
    // Verificar que se cerró (no hay input visible)
    const activeEditor = screen.queryByTestId('enti-editor');
    if (activeEditor) {
       expect(activeEditor).toHaveClass('hidden');
    }
    
    // Reabrir Enti y verificar que carga los datos guardados
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    
    // Volver a buscar el input
    // Como es el único abierto o el activo, podemos buscar el input sin hidden
    const reOpenedInput = screen.getAllByTestId('input-name').find(el => {
      const parent = el.closest('.enti-editor');
      return parent && !parent.classList.contains('hidden');
    }) as HTMLInputElement;
    
    expect(reOpenedInput.value).toBe('Enti Original');
  });

  it('TEST-FIA024-04: Otros editores conservan drafts y dirty state', () => {
    const enti1 = createEnti('E1', 'Enti 1', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti 2', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    fireEvent.click(screen.getByTestId('enti-item-E2'));
    
    // Modificar E2 (activo)
    const inputs2 = screen.getAllByTestId('input-name');
    fireEvent.change(inputs2[1], { target: { value: 'Enti 2 Dirty' } });
    
    // Cambiar a E1 y modificarlo
    fireEvent.click(screen.getByTestId('tab-item-E1'));
    const inputs1 = screen.getAllByTestId('input-name');
    fireEvent.change(inputs1[0], { target: { value: 'Enti 1 Dirty' } });
    
    // Descartar E1
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId('btn-dialog-descartar'));
    
    // E2 pasa a ser el activo, verificamos que sigue dirty (al intentar cerrarlo, mostrará diálogo)
    const remainingEditors = screen.getAllByTestId('enti-editor');
    const e2Editor = remainingEditors.find(e => !e.classList.contains('hidden'))!;
    
    // Si intentamos cerrar E2, mostrará diálogo (es decir, está dirty)
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    expect(screen.getByTestId('close-dialog')).toBeInTheDocument();
    
    // Y el input de E2 sigue modificado
    const input2 = e2Editor.querySelector('[data-testid="input-name"]') as HTMLInputElement;
    expect(input2.value).toBe('Enti 2 Dirty');
  });

  it('TEST-FIA024-05, 06: Listado lateral refleja Enti guardado', () => {
    const enti1 = createEnti('E1', 'Enti Clean', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    
    const inputName = screen.getByTestId('input-name') as HTMLInputElement;
    fireEvent.change(inputName, { target: { value: 'Enti Dirty' } });
    
    // Sidebar dice 'Enti Dirty' por el borrador
    expect(screen.getByTestId('enti-item-E1')).toHaveTextContent('Enti Dirty');
    
    // Descartar
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId('btn-dialog-descartar'));
    
    // Sidebar sigue diciendo 'Enti Clean'
    expect(screen.getByTestId('enti-item-E1')).toHaveTextContent('Enti Clean');
  });
});
