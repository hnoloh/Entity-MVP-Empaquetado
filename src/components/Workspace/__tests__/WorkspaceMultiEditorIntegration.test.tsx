import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';
import { entiRepository } from '../../../domain/enti/entiRepository';
import { createEnti } from '../../../domain/enti/createEnti';

describe('WorkspaceMultiEditorIntegration - FIA-020', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entiRepository.clear();
  });

  const getEditorForEnti = (entiName: string) => {
    const editors = screen.getAllByTestId('enti-editor');
    return editors.find(editor => {
      // It can be minimized (title: Editor: [name]) or maximized (input value)
      const isMinimized = within(editor).queryByText(`Editor: ${entiName}`) !== null;
      if (isMinimized) return true;
      const input = within(editor).queryByTestId('input-name') as HTMLInputElement;
      return input && input.value === entiName;
    });
  };

  it('TEST-FIA020-01: abrir dos Entis distintos crea dos editores', () => {
    const enti1 = createEnti('E1', 'Enti Uno', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti Dos', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    fireEvent.click(screen.getByTestId('enti-item-E2'));
    
    const editors = screen.getAllByTestId('enti-editor');
    expect(editors.length).toBe(2);
    
    expect(getEditorForEnti('Enti Uno')).toBeDefined();
    expect(getEditorForEnti('Enti Dos')).toBeDefined();
  });

  it('TEST-FIA020-02, 03: cada editor mantiene draft aislado por Enti.id y Guardar solo persiste su propio Enti', () => {
    const enti1 = createEnti('E1', 'Enti Uno', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti Dos', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    fireEvent.click(screen.getByTestId('enti-item-E2'));
    
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    const editor1 = getEditorForEnti('Enti Uno')!;
    const input1 = within(editor1).getByTestId('input-name');
    fireEvent.change(input1, { target: { value: 'Enti Uno Modificado' } });

    // Cambiamos a Enti Dos (minimiza Enti Uno)
    fireEvent.click(screen.getByTestId('enti-item-E2'));
    const editor2 = getEditorForEnti('Enti Dos')!;
    const input2 = within(editor2).getByTestId('input-name');
    fireEvent.change(input2, { target: { value: 'Enti Dos Modificado' } });
    
    // Restauramos Enti Uno
    fireEvent.click(screen.getByTestId('tab-item-E1')); // Restauramos haciendo click en la pestaña
    // Guardar editor 1 mediante el flujo de cierre (sin save button permanente)
    fireEvent.click(document.querySelector('[data-testid="tab-close-E1"]')!);
    
    const dialog1 = screen.getByTestId('close-dialog');
    fireEvent.click(within(dialog1).getByTestId('btn-dialog-guardar'));

    const saved1 = entiRepository.getById('E1');
    const saved2 = entiRepository.getById('E2');
    
    expect(saved1?.name).toBe('Enti Uno Modificado');
    expect(saved2?.name).toBe('Enti Dos'); // no modificado
  });

  it('TEST-FIA020-04, 05: Descartar y Cancelar afectan solo la instancia correspondiente', () => {
    const enti1 = createEnti('E1', 'Enti Uno', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti Dos', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    fireEvent.click(screen.getByTestId('enti-item-E2'));
    
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    const editor1 = getEditorForEnti('Enti Uno')!;
    fireEvent.change(within(editor1).getByTestId('input-name'), { target: { value: 'Draft 1' } });

    fireEvent.click(screen.getByTestId('enti-item-E2'));
    const editor2 = getEditorForEnti('Enti Dos')!;
    fireEvent.change(within(editor2).getByTestId('input-name'), { target: { value: 'Draft 2' } });
    
    // Restauramos Enti Uno activando su pestaña
    fireEvent.click(screen.getByTestId('tab-item-E1'));
    fireEvent.click(document.querySelector('[data-testid="tab-close-E1"]')!);
    // En editor 1 aparece el dialogo
    const dialog1 = screen.getByTestId('close-dialog');
    expect(dialog1).toBeInTheDocument();
    
    // Cancelar en editor 1
    fireEvent.click(within(dialog1).getByTestId('btn-dialog-cancelar'));
    expect(screen.queryByTestId('close-dialog')).not.toBeInTheDocument();
    
    // Volver a cerrar y descartar
    fireEvent.click(document.querySelector('[data-testid="tab-close-E1"]')!);
    const dialog1Again = screen.getByTestId('close-dialog');
    fireEvent.click(within(dialog1Again).getByTestId('btn-dialog-descartar'));
    
    // Editor 1 desaparece, Editor 2 sigue vivo con su draft
    expect(getEditorForEnti('Draft 1')).toBeUndefined();
    expect(getEditorForEnti('Draft 2')).toBeDefined();
  });

  it('TEST-FIA020-06: minimizar/restaurar una instancia no afecta a otras', () => {
    const enti1 = createEnti('E1', 'Enti Uno', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti Dos', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    
    // Abrir segundo editor para quitar foco del primero
    fireEvent.click(screen.getByTestId('enti-item-E2'));
    expect(screen.getByTestId('tab-item-E1')).not.toHaveClass('active'); 
    expect(screen.getByTestId('tab-item-E2')).toHaveClass('active'); 
    
    // Restaurar manualmente clickeando la pestaña
    fireEvent.click(screen.getByTestId('tab-item-E1'));
    expect(screen.getByTestId('tab-item-E1')).toHaveClass('active');
  });

  it('TEST-FIA020-07: eliminar Enti abierto desmonta solo su editor', () => {
    const enti1 = createEnti('E1', 'Enti Uno', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti Dos', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    fireEvent.click(screen.getByTestId('enti-item-E2'));
    
    // Borrar E1
    fireEvent.click(screen.getByTestId('btn-delete-enti-E1'));
    fireEvent.click(screen.getByTestId('btn-confirm-delete'));
    
    expect(getEditorForEnti('Enti Uno')).toBeUndefined();
    expect(getEditorForEnti('Enti Dos')).toBeDefined();
  });

  it('TEST-FIA020-08: no se duplica editor del mismo id', () => {
    const enti1 = createEnti('E1', 'Enti Uno', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    
    const editors = screen.getAllByTestId('enti-editor');
    expect(editors.length).toBe(1);
  });

  it('TEST-FIA020-08B: máximo 1 pestaña activa, al abrir el 2do se oculta el 1ro', () => {
    const enti1 = createEnti('E1', 'Enti Uno', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti Dos', { function: '', rules: [], knowledge: '', workMaterial: '' });
    
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    
    const editor1 = screen.getAllByTestId('enti-editor')[0];
    expect(editor1).not.toHaveClass('hidden');
    
    // Al abrir el 2do, el 1ro se oculta
    fireEvent.click(screen.getByTestId('enti-item-E2'));
    
    // Hay 2 editores renderizados
    const editors = screen.getAllByTestId('enti-editor');
    expect(editors.length).toBe(2);
    
    // Pero solo el segundo está activo (no hidden)
    expect(editors[0]).toHaveClass('hidden');
    expect(editors[1]).not.toHaveClass('hidden');
  });

  it('TEST-FIA020-09, 10, 11: no storage, forbidden units intactas y Ghost visible', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    
    const enti1 = createEnti('E1', 'Enti Uno', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    expect(screen.getByTestId('workspace-ghost-view')).toBeInTheDocument();
    
    // Verificamos que no hay persistencia de storage en operaciones
    fireEvent.click(screen.getByTestId('enti-item-E1'));
    
    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
    
    // Forbidden units check (no chat, no tabs logic, just raw instances)
    const shellHTML = screen.getByTestId('workspace-shell').outerHTML;
    expect(shellHTML).not.toMatch(/chat/i);
    expect(shellHTML).not.toMatch(/tab-list/i); // No layout manager / tabs for now
  });
});
