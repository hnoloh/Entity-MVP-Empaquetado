import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';
import { entiRepository } from '../../../domain/enti/entiRepository';
import { createEnti } from '../../../domain/enti/createEnti';

describe('WorkspaceSaveChangesIntegration - FIA-023', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entiRepository.clear();
  });

  it('TEST-FIA023-01, 02: modificar un Enti activa dirty y Guardar mediante el diálogo de cierre guarda en repo', () => {
    const enti1 = createEnti('E1', 'Enti Uno', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    
    // Abrir Enti Uno
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    
    // Modificar nombre
    const inputName = screen.getByTestId('input-name') as HTMLInputElement;
    fireEvent.change(inputName, { target: { value: 'Enti Modificado' } });
    
    // Intentar cerrar (como isDirty es true, se abre el diálogo)
    const btnClose = screen.getAllByTestId('btn-close-editor')[0];
    fireEvent.click(btnClose);
    
    // Guardar desde el diálogo
    const btnSaveDialog = screen.getByTestId('btn-dialog-guardar');
    expect(btnSaveDialog).toBeInTheDocument();
    fireEvent.click(btnSaveDialog);
    
    // Verificamos que se guardó en el repo
    const savedEnti = entiRepository.getById('E1');
    expect(savedEnti?.name).toBe('Enti Modificado');
  });

  it('TEST-FIA023-03: Guardar Nombre actualiza el listado lateral', () => {
    const enti1 = createEnti('E1', 'Enti Viejo', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    
    const inputName = screen.getByTestId('input-name') as HTMLInputElement;
    fireEvent.change(inputName, { target: { value: 'Enti Nuevo' } });
    
    // El listado lateral dice 'Enti Nuevo' porque refleja el draft vivo
    expect(screen.getByTestId('enti-item-E1')).toHaveTextContent('Enti Nuevo');
    
    // Guardar (abriendo dialogo de cierre)
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId('btn-dialog-guardar'));
    
    // Ahora dice 'Enti Nuevo'
    expect(screen.getByTestId('enti-item-E1')).toHaveTextContent('Enti Nuevo');
  });

  it('TEST-FIA023-05: Guardar en editor activo no altera drafts dirty de otros editores', () => {
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
    
    // Cambiar a E1
    fireEvent.click(screen.getByTestId('tab-item-E1'));
    
    // Modificar E1
    const inputs1 = screen.getAllByTestId('input-name');
    fireEvent.change(inputs1[0], { target: { value: 'Enti 1 Dirty' } });
    
    // Guardar E1 mediante diálogo de cierre
    const e1CloseBtn = screen.getByTestId('tab-close-E1');
    fireEvent.click(e1CloseBtn);
    fireEvent.click(screen.getByTestId('btn-dialog-guardar'));
    
    // Volver a E2 (que ahora es el único abierto / activo en DOM o el primero)
    // Ya que E1 se cerró al guardar.
    
    // E2 todavía mantiene su draft
    const input2Again = screen.getByTestId('input-name') as HTMLInputElement;
    expect(input2Again.value).toBe('Enti 2 Dirty');
  });

  it('TEST-FIA023-07: estado se recalcula tras guardar', () => {
    // Creamos incompleto
    const enti1 = createEnti('E1', 'Enti', { function: 'test', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    
    expect(screen.getByTestId('status-indicator-E1')).toHaveClass('incomplete');
    
    // Configuramos IA Cloud
    fireEvent.click(screen.getByTestId('input-cognitive-mode'));
    fireEvent.click(screen.getByTestId('option-cloud'));
    
    const inputApiKey = screen.getByTestId('input-openai-api-key');
    fireEvent.change(inputApiKey, { target: { value: 'sk-1234' } });
    fireEvent.click(screen.getByTestId('btn-accept-api-key'));
    
    // Guardamos cerrando
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId('btn-dialog-guardar'));
    
    // Ahora debe estar completo en la lista lateral
    expect(screen.getByTestId('status-indicator-E1')).toHaveClass('complete');
  });
});
