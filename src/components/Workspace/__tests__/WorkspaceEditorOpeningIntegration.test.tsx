import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';
import { entiRepository } from '../../../domain/enti/entiRepository';
import { createEnti } from '../../../domain/enti/createEnti';

describe('WorkspaceEditorOpeningIntegration - FIA-018', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entiRepository.clear();
  });

  it('TEST-FIA018-01: Seleccionar Enti existente abre EntiEditor en Mesa', () => {
    const mockEnti = createEnti('E1', 'Enti Test 1', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(mockEnti);
    
    render(<WorkspaceShell />);
    
    // Al principio no hay editor
    expect(screen.queryByTestId('enti-editor')).not.toBeInTheDocument();
    
    // Seleccionamos
    fireEvent.click(screen.getByText('Enti Test 1'));
    
    // Aparece el editor
    expect(screen.getByTestId('enti-editor')).toBeInTheDocument();
  });

  it('TEST-FIA018-02: Existe multi-editor activo (modificado por FIA-020)', () => {
    const enti1 = createEnti('E1', 'Enti 1', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti 2', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByText('Enti 1'));
    expect(screen.getAllByTestId('enti-editor')).toHaveLength(1);
    
    fireEvent.click(screen.getByText('Enti 2'));
    expect(screen.getAllByTestId('enti-editor')).toHaveLength(2); // Modificado por FIA-020
  });

  it('TEST-FIA018-03: Seleccionar otro Enti reemplaza contenido y evita carryover de draft', () => {
    const enti1 = createEnti('E1', 'Enti 1', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti 2', { function: '', rules: [], knowledge: '', workMaterial: '' });
    enti2.cognitiveConfig = { mode: 'local', model: 'Llama-3-8B-Instruct' };
    
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByText('Enti 1'));
    const input1 = screen.getAllByTestId('input-name')[0];
    expect(input1).toHaveValue('Enti 1');
    expect(screen.getAllByTestId('input-cognitive-mode')[0].getAttribute('data-value')).toBe('unconfigured');
    
    fireEvent.change(input1, { target: { value: 'Dirty Enti 1' } });
    
    fireEvent.click(screen.getByText('Enti 2'));
    
    const inputs = screen.getAllByTestId('input-name');
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toHaveValue('Enti 2'); // Sin carryover
    expect(screen.getAllByTestId('input-cognitive-mode')[0].getAttribute('data-value')).toBe('local');
  });

  it('TEST-FIA018-04: Click en eliminar no dispara apertura accidental del editor', () => {
    const mockEnti = createEnti('E1', 'A Eliminar', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(mockEnti);
    
    render(<WorkspaceShell />);
    
    const deleteBtn = screen.getByTestId('btn-delete-enti-E1');
    fireEvent.click(deleteBtn);
    fireEvent.click(screen.getByTestId('btn-confirm-delete'));
    
    expect(screen.queryByTestId('enti-editor')).not.toBeInTheDocument();
  });

  it('TEST-FIA018-05: Eliminar Enti abierto limpia selectedEntiId y desmonta EntiEditor', () => {
    const mockEnti = createEnti('E1', 'A Eliminar', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(mockEnti);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByText('A Eliminar'));
    expect(screen.getByTestId('enti-editor')).toBeInTheDocument();
    
    const deleteBtn = screen.getByTestId('btn-delete-enti-E1');
    fireEvent.click(deleteBtn);
    fireEvent.click(screen.getByTestId('btn-confirm-delete'));
    
    expect(screen.queryByTestId('enti-editor')).not.toBeInTheDocument();
  });

  it('TEST-FIA018-06: Apertura carga Nombre, Harness Base y Configuración Cognitiva ya bloqueados', () => {
    const mockEnti = createEnti('E1', 'Enti Completo', { function: 'Función', rules: ['Regla 1'], knowledge: 'K', workMaterial: 'WM' });
    entiRepository.save(mockEnti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Enti Completo'));
    
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('harness-base-section')).toBeInTheDocument();
    expect(screen.getByTestId('cognitive-config-section')).toBeInTheDocument();
  });

  it('TEST-FIA018-07: No se persiste editorOpen, selectedEntiId, draft, dirty, layout ni focus', () => {
    const mockEnti = createEnti('E1', 'Persistencia', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(mockEnti);
    
    const { unmount } = render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByText('Persistencia'));
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'Dirty persistencia' } });
    
    expect(screen.getByTestId('enti-editor')).toBeInTheDocument();
    
    unmount(); // Desmontaje de la app (simula recarga)
    
    render(<WorkspaceShell />);
    
    // Al recargar, todo se ha limpiado
    expect(screen.queryByTestId('enti-editor')).not.toBeInTheDocument();
  });

  it('TEST-FIA018-08, 09: Forbidden-units y Ghost permanece', () => {
    const mockEnti = createEnti('E1', 'Ghost Enti', { function: '', rules: [], knowledge: '', workMaterial: '' });
    mockEnti.cognitiveConfig = { mode: 'cloud', apiKey: 'sk-forbidden' };
    entiRepository.save(mockEnti);
    
    const consoleSpy = vi.spyOn(console, 'log');
    
    render(<WorkspaceShell />);
    expect(screen.getByTestId('workspace-ghost-view')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Ghost Enti'));
    
    // API Key nunca se muestra en consola ni se valida en red
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('sk-forbidden'));
    
    consoleSpy.mockRestore();
  });
});
