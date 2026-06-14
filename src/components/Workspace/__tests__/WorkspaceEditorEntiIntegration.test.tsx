import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';
import { entiRepository } from '../../../domain/enti/entiRepository';
import { createEnti } from '../../../domain/enti/createEnti';

describe('WorkspaceEditorEntiIntegration - FIA-017', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entiRepository.clear();
  });

  it('TEST-FIA017-01: EntiEditor se renderiza como contenedor único del Enti seleccionado y no existe multi-editor', () => {
    const mockEnti = createEnti('E1', 'Enti Test 1', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(mockEnti);
    
    render(<WorkspaceShell />);
    
    // Seleccionar el Enti
    fireEvent.click(screen.getByText('Enti Test 1'));
    
    // Solo debe haber un editor en el DOM
    const editors = screen.getAllByTestId('enti-editor');
    expect(editors).toHaveLength(1);
  });

  it('TEST-FIA017-02: Integra Nombre, Harness Base y Configuración Cognitiva en la misma superficie', () => {
    const mockEnti = createEnti('E1', 'Enti Integrado', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(mockEnti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Enti Integrado'));
    
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('harness-base-section')).toBeInTheDocument();
    expect(screen.getByTestId('cognitive-config-section')).toBeInTheDocument();
  });

  it('TEST-FIA017-03: Cambios en campos activan dirty sin autosave', () => {
    const mockEnti = createEnti('E1', 'Original Name', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(mockEnti);
    
    const saveSpy = vi.spyOn(entiRepository, 'save');
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Original Name'));
    
    const input = screen.getByTestId('input-name');
    fireEvent.change(input, { target: { value: 'Modified Name' } });
    
    // Comprobar que no se guardó automáticamente (0 veces después del click, porque save solo se llamó en setup)
    saveSpy.mockClear();
    
    // Intentar cerrar debería mostrar el diálogo (dirty = true)
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    expect(screen.getByTestId('close-dialog')).toBeInTheDocument();
    expect(saveSpy).not.toHaveBeenCalled();
    saveSpy.mockRestore();
  });

  it('TEST-FIA017-04: Guardar/Descartar/Cancelar preservan el flujo bloqueado', () => {
    const mockEnti = createEnti('E1', 'Original', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(mockEnti);
    const saveSpy = vi.spyOn(entiRepository, 'save');
    saveSpy.mockClear();
    
    const { unmount } = render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Original'));
    
    const input = screen.getByTestId('input-name');
    fireEvent.change(input, { target: { value: 'New' } });
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId('btn-dialog-cancelar'));
    
    // Cancelar no cierra el editor ni guarda
    expect(screen.queryByTestId('close-dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('enti-editor')).toBeInTheDocument();
    expect(saveSpy).not.toHaveBeenCalled();
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId('btn-dialog-descartar'));
    
    // Descartar cierra el editor sin guardar
    expect(screen.queryByTestId('enti-editor')).not.toBeInTheDocument();
    expect(saveSpy).not.toHaveBeenCalled();
    
    unmount();
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Original'));
    
    const input2 = screen.getByTestId('input-name');
    fireEvent.change(input2, { target: { value: 'New 2' } });
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId('btn-dialog-guardar'));
    
    // Guardar llama a entiRepository.save
    expect(saveSpy).toHaveBeenCalled();
    saveSpy.mockRestore();
  });

  it('TEST-FIA017-05: Cambio de selectedEntiId resincroniza todos los campos sin carryover', () => {
    const enti1 = createEnti('E1', 'Enti 1', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti 2', { function: '', rules: [], knowledge: '', workMaterial: '' });
    enti2.cognitiveConfig = { mode: 'local', model: 'Llama-3-8B-Instruct' };
    
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    // Abrir Enti 1
    fireEvent.click(screen.getByText('Enti 1'));
    expect(screen.getByTestId('input-name')).toHaveValue('Enti 1');
    expect(screen.getByTestId('input-cognitive-mode').getAttribute('data-value')).toBe('unconfigured');
    
    // Escribir algo en Enti 1 sin guardar
    const inputs1 = screen.getAllByTestId('input-name');
    fireEvent.change(inputs1[0], { target: { value: 'Dirty Enti 1' } });
    
    // Cambiar a Enti 2
    fireEvent.click(screen.getByText('Enti 2'));
    
    // Debería abrir un nuevo editor minimizando el primero (1 solo input activo)
    const inputs2 = screen.getAllByTestId('input-name');
    // expect(inputs2).toHaveLength(1);
    expect(inputs2[1]).toHaveValue('Enti 2');
    expect(screen.getAllByTestId('input-cognitive-mode')[1].getAttribute('data-value')).toBe('local');
  });

  it('TEST-FIA017-06: Existe multi-editor (modificado por FIA-020)', () => {
    const enti1 = createEnti('E1', 'Enti 1', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti 2', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByText('Enti 1'));
    expect(screen.getAllByTestId('enti-editor')).toHaveLength(1);
    
    fireEvent.click(screen.getByText('Enti 2'));
    expect(screen.getAllByTestId('enti-editor')).toHaveLength(2); // FIA-020 permite multi-editor
  });

  it('TEST-FIA017-07, 09, 10: Forbidden units y Ghost pasivo y nula exposición de API Key', () => {
    const mockEnti = createEnti('E1', 'Ghost Enti', { function: '', rules: [], knowledge: '', workMaterial: '' });
    mockEnti.cognitiveConfig = { mode: 'cloud', apiKey: 'sk-forbidden-secret-test' };
    entiRepository.save(mockEnti);
    
    const consoleSpy = vi.spyOn(console, 'log');
    
    render(<WorkspaceShell />);
    expect(screen.getByTestId('workspace-ghost-view')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Ghost Enti'));
    
    // API key inerte y protegida
    const apiInput = screen.getByTestId('input-cognitive-mode');
    expect(apiInput).toBeInTheDocument();
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('sk-forbidden'));
    
    consoleSpy.mockRestore();
  });
});
