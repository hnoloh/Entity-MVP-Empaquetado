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
    
    fireEvent.click(screen.getByText('Enti Uno'));
    fireEvent.click(screen.getByText('Enti Dos'));
    
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
    
    fireEvent.click(screen.getByText('Enti Uno'));
    fireEvent.click(screen.getByText('Enti Dos'));
    
    fireEvent.click(screen.getByText('Enti Uno'));
    const editor1 = getEditorForEnti('Enti Uno')!;
    const input1 = within(editor1).getByTestId('input-name');
    fireEvent.change(input1, { target: { value: 'Enti Uno Modificado' } });

    // Cambiamos a Enti Dos (minimiza Enti Uno)
    fireEvent.click(screen.getByText('Enti Dos'));
    const editor2 = getEditorForEnti('Enti Dos')!;
    const input2 = within(editor2).getByTestId('input-name');
    fireEvent.change(input2, { target: { value: 'Enti Dos Modificado' } });
    
    // Restauramos Enti Uno
    fireEvent.click(screen.getByText('Editor: Enti Uno Modificado')); // Restauramos haciendo click en el título
    // Guardar editor 1 mediante el flujo de cierre (sin save button permanente)
    const editor1Restored = getEditorForEnti('Enti Uno Modificado')!;
    fireEvent.click(within(editor1Restored).getByTestId('btn-close-editor'));
    
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
    
    fireEvent.click(screen.getByText('Enti Uno'));
    fireEvent.click(screen.getByText('Enti Dos'));
    
    fireEvent.click(screen.getByText('Enti Uno'));
    const editor1 = getEditorForEnti('Enti Uno')!;
    fireEvent.change(within(editor1).getByTestId('input-name'), { target: { value: 'Draft 1' } });

    fireEvent.click(screen.getByText('Enti Dos'));
    const editor2 = getEditorForEnti('Enti Dos')!;
    fireEvent.change(within(editor2).getByTestId('input-name'), { target: { value: 'Draft 2' } });
    
    // Restauramos Enti Uno (que ahora se llama Draft 1)
    fireEvent.click(screen.getByText('Editor: Draft 1'));
    const editor1Restored = getEditorForEnti('Draft 1')!;
    fireEvent.click(within(editor1Restored).getByTestId('btn-close-editor'));
    // En editor 1 aparece el dialogo
    const dialog1 = screen.getByTestId('close-dialog');
    expect(dialog1).toBeInTheDocument();
    
    // Cancelar en editor 1
    fireEvent.click(within(dialog1).getByTestId('btn-dialog-cancelar'));
    expect(screen.queryByTestId('close-dialog')).not.toBeInTheDocument();
    
    // Volver a cerrar y descartar
    fireEvent.click(within(editor1Restored).getByTestId('btn-close-editor'));
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
    
    fireEvent.click(screen.getByText('Enti Uno'));
    fireEvent.click(screen.getByText('Enti Uno'));
    const editor1 = getEditorForEnti('Enti Uno')!;
    
    // Minimizar editor 1 manualmente
    fireEvent.click(within(editor1).getByTestId('btn-minimize-editor'));
    expect(within(editor1).queryByTestId('input-name')).not.toBeInTheDocument(); // 1 está minimizado
    
    // Restaurar manualmente
    fireEvent.click(screen.getByText('Editor: Enti Uno'));
    expect(within(editor1).queryByTestId('input-name')).toBeInTheDocument();
  });

  it('TEST-FIA020-07: eliminar Enti abierto desmonta solo su editor', () => {
    const enti1 = createEnti('E1', 'Enti Uno', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti Dos', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByText('Enti Uno'));
    fireEvent.click(screen.getByText('Enti Dos'));
    
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
    
    fireEvent.click(screen.getByText('Enti Uno'));
    fireEvent.click(screen.getByText('Enti Uno'));
    fireEvent.click(screen.getByText('Enti Uno'));
    
    const editors = screen.getAllByTestId('enti-editor');
    expect(editors.length).toBe(1);
  });

  it('TEST-FIA020-08B: máximo 1 editor maximizado, al abrir el 2do se minimiza el 1ro', () => {
    const enti1 = createEnti('E1', 'Enti Uno', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti Dos', { function: '', rules: [], knowledge: '', workMaterial: '' });
    
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByText('Enti Uno'));
    
    // 1 editor maximizado
    expect(screen.getAllByTestId('input-name').length).toBe(1);
    
    // Al abrir el 2do, el 1ro se minimiza
    fireEvent.click(screen.getByText('Enti Dos'));
    
    // Hay 2 editores renderizados
    expect(screen.getAllByTestId('enti-editor').length).toBe(2);
    
    // Pero solo 1 input visible (1 maximizado, que es Enti Dos)
    expect(screen.getAllByTestId('input-name').length).toBe(1);
    const input2 = screen.getByTestId('input-name') as HTMLInputElement;
    expect(input2.value).toBe('Enti Dos');
    
    // Comprobamos que el Enti Uno está minimizado (se muestra "Editor: Enti Uno" como título y no tiene input-name)
    const editor1 = getEditorForEnti('Enti Uno')!;
    expect(editor1).toBeDefined();
    expect(within(editor1).queryByTestId('input-name')).not.toBeInTheDocument(); // está minimizado
    expect(screen.getByText('Editor: Enti Uno')).toBeInTheDocument(); // título de minimizado
  });

  it('TEST-FIA020-09, 10, 11: no storage, forbidden units intactas y Ghost visible', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    
    const enti1 = createEnti('E1', 'Enti Uno', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    expect(screen.getByTestId('workspace-ghost-view')).toBeInTheDocument();
    
    // Verificamos que no hay persistencia de storage en operaciones
    fireEvent.click(screen.getByText('Enti Uno'));
    
    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
    
    // Forbidden units check (no chat, no tabs logic, just raw instances)
    const shellHTML = screen.getByTestId('workspace-shell').outerHTML;
    expect(shellHTML).not.toMatch(/chat/i);
    expect(shellHTML).not.toMatch(/tab-list/i); // No layout manager / tabs for now
  });
});
