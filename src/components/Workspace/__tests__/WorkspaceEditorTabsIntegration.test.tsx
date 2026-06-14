import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';
import { entiRepository } from '../../../domain/enti/entiRepository';
import { createEnti } from '../../../domain/enti/createEnti';

describe('WorkspaceEditorTabsIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entiRepository.clear();
  });

  it('TEST-TAB-01: Tab bar is rendered when Entis are opened', () => {
    const mockEnti = createEnti('E1', 'Enti Test', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(mockEnti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Enti Test'));
    
    const tabBar = screen.getByTestId('tab-bar');
    expect(tabBar).toBeInTheDocument();
    
    const tabItem = screen.getByTestId('tab-item-E1');
    expect(tabItem).toHaveClass('active');
  });

  it('TEST-TAB-02: Switching tabs preserves draft state but hides visual editor', () => {
    const enti1 = createEnti('E1', 'Enti 1', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti 2', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByText('Enti 1'));
    
    // Cambiamos contenido en E1
    const nameInputE1 = screen.getAllByTestId('input-name')[0] as HTMLInputElement;
    fireEvent.change(nameInputE1, { target: { value: 'Borrador modificado 1' } });
    
    // Abrimos E2
    fireEvent.click(screen.getByText('Enti 2'));
    
    // La pestaña activa cambia
    expect(screen.getByTestId('tab-item-E1')).not.toHaveClass('active');
    expect(screen.getByTestId('tab-item-E2')).toHaveClass('active');
    
    // El input-name de E2 ahora es visible
    const inputs = screen.getAllByTestId('input-name');
    expect((inputs[1] as HTMLInputElement).value).toBe('Enti 2'); // inputs[1] es E2 porque se renderizan todos
    
    // Cambiamos de pestaña a E1
    fireEvent.click(screen.getByTestId('tab-item-E1'));
    
    // El draft se ha preservado
    expect((screen.getAllByTestId('input-name')[0] as HTMLInputElement).value).toBe('Borrador modificado 1');
  });

  it('TEST-TAB-03: Closing active tab switches to another tab', () => {
    const enti1 = createEnti('E1', 'Enti 1', { function: '', rules: [], knowledge: '', workMaterial: '' });
    const enti2 = createEnti('E2', 'Enti 2', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByText('Enti 1'));
    fireEvent.click(screen.getByText('Enti 2')); // E2 está activa
    
    expect(screen.getByTestId('tab-item-E2')).toHaveClass('active');
    
    // Cerramos E2
    fireEvent.click(screen.getByTestId('tab-close-E2'));
    
    // Ahora la activa es E1
    expect(screen.queryByTestId('tab-item-E2')).not.toBeInTheDocument();
    expect(screen.getByTestId('tab-item-E1')).toHaveClass('active');
  });
  
  it('TEST-TAB-04: Closing last tab removes tab bar', () => {
    const enti1 = createEnti('E1', 'Enti 1', { function: '', rules: [], knowledge: '', workMaterial: '' });
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByText('Enti 1'));
    expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    expect(screen.queryByTestId('tab-bar')).not.toBeInTheDocument();
  });
});
