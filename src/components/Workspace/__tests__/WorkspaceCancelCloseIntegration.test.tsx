import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';
import { entiRepository } from '../../../domain/enti/entiRepository';
import { createEnti } from '../../../domain/enti/createEnti';

describe('WorkspaceCancelCloseIntegration - FIA-025', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entiRepository.clear();
  });

  it('TEST-FIA025-01, 02, 03, 04, 05: Cancelar cierra solo el dialogo, mantiene editor abierto, conserva draft, conserva dirty y no altera repo', () => {
    const enti1 = createEnti('E1', 'Enti Original', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    
    // Abrir Enti Uno
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    
    // Modificar nombre
    const inputName = screen.getByTestId('input-name') as HTMLInputElement;
    fireEvent.change(inputName, { target: { value: 'Enti Modificado' } });
    
    // Intentar cerrar (aparece el minimenu)
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    expect(screen.getByTestId('close-dialog')).toBeInTheDocument();
    
    // Cancelar cierre
    fireEvent.click(screen.getByTestId('btn-dialog-cancelar'));
    
    // El diálogo se cerró
    expect(screen.queryByTestId('close-dialog')).not.toBeInTheDocument();
    
    // El editor sigue abierto (no está hidden)
    const editors = screen.getAllByTestId('enti-editor');
    expect(editors[0]).not.toHaveClass('hidden');
    
    // El draft se conserva
    expect(inputName.value).toBe('Enti Modificado');
    
    // El repo no se modificó
    const repoEnti = entiRepository.getById('E1');
    expect(repoEnti?.name).toBe('Enti Original');
    
    // El dirty se conserva (intentar cerrar de nuevo sigue abriendo el minimenú)
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    expect(screen.getByTestId('close-dialog')).toBeInTheDocument();
  });

  it('TEST-FIA025-06: Cancelar no actualiza listado lateral', () => {
    const enti1 = createEnti('E1', 'Enti Clean', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    
    const inputName = screen.getByTestId('input-name') as HTMLInputElement;
    fireEvent.change(inputName, { target: { value: 'Enti Dirty' } });
    
    // Intentar cerrar y luego cancelar
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId('btn-dialog-cancelar'));
    
    // Sidebar todavía dice 'Enti Clean'
    expect(screen.getByTestId('enti-item-E1')).toHaveTextContent('Enti Clean');
  });

  it('TEST-FIA025-07: multi-editor: Cancelar en un editor no afecta otros drafts', () => {
    const enti1 = createEnti('E1', 'Enti 1', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti 2', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    // Abrir ambos
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    fireEvent.click(screen.getByTestId('enti-item-E2'));
    
    // Modificar E2 (activo)
    const inputs2 = screen.getAllByTestId('input-name');
    fireEvent.change(inputs2[1], { target: { value: 'Enti 2 Dirty' } });
    
    // Cambiar a E1 y modificarlo
    fireEvent.click(screen.getByTestId('tab-item-E1'));
    const inputs1 = screen.getAllByTestId('input-name');
    fireEvent.change(inputs1[0], { target: { value: 'Enti 1 Dirty' } });
    
    // En E1, intentar cerrar y cancelar
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId('btn-dialog-cancelar'));
    
    // Cambiar a E2
    fireEvent.click(screen.getByTestId('tab-item-E2'));
    
    // E2 conserva su draft
    const inputs2Again = screen.getAllByTestId('input-name');
    expect((inputs2Again[1] as HTMLInputElement).value).toBe('Enti 2 Dirty');
  });
});
