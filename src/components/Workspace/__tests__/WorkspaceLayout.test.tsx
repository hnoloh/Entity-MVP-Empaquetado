import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';

describe('FIA-006 Layout Base Workspace', () => {
  it('Layout integration: Hub/Columna/Mesa conviven de forma estable en estado base', () => {
    render(<WorkspaceShell entisCount={0} gruposCount={0} />);
    
    // Verificamos instancias únicas
    const shells = screen.getAllByTestId('workspace-shell');
    expect(shells).toHaveLength(1);
    
    const hubs = screen.getAllByTestId('hub-region');
    expect(hubs).toHaveLength(1);
    
    const columns = screen.getAllByTestId('entities-column-region');
    expect(columns).toHaveLength(1);
    
    const workbenches = screen.getAllByTestId('workbench-region');
    expect(workbenches).toHaveLength(1);
  });

  it('Empty state: 0 Entis/0 Grupos muestra Ghost y MANTIENE Hub/Columna/Mesa intactos', () => {
    render(<WorkspaceShell entisCount={0} gruposCount={0} />);
    
    expect(screen.getByTestId('workspace-ghost-view')).toBeInTheDocument();
    expect(screen.getByTestId('hub-region')).toBeInTheDocument();
    expect(screen.getByTestId('entities-column-region')).toBeInTheDocument();
    expect(screen.getByTestId('workbench-region')).toBeInTheDocument();
  });

  it('Non-empty Enti: 1 Enti/0 Grupos oculta Ghost pero mantiene el layout base', () => {
    render(<WorkspaceShell entisCount={1} gruposCount={0} />);
    
    expect(screen.queryByTestId('workspace-ghost-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('hub-region')).toBeInTheDocument();
    expect(screen.getByTestId('workbench-region')).toBeInTheDocument();
  });

  it('Non-empty Grupo: 0 Entis/1 Grupo oculta Ghost y mantiene el layout base', () => {
    render(<WorkspaceShell entisCount={0} gruposCount={1} />);
    
    expect(screen.queryByTestId('workspace-ghost-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('hub-region')).toBeInTheDocument();
    expect(screen.getByTestId('workbench-region')).toBeInTheDocument();
  });

  it('No-embed: ausencia total de ChatRegion/ChatView/ChatWindow en el DOM del Workspace', () => {
    const { container } = render(<WorkspaceShell />);
    
    expect(container.innerHTML).not.toMatch(/chat-region/i);
    expect(container.innerHTML).not.toMatch(/chat-view/i);
    expect(container.innerHTML).not.toMatch(/chat-window/i);
  });

  it('State: visible/minimizado/restaurado se comporta sin side-effects ni escrituras locales', () => {
    render(<WorkspaceShell />);
    const shell = screen.getByTestId('workspace-shell');
    const toggleBtn = screen.getByTestId('toggle-state-btn');
    
    expect(shell.getAttribute('data-state')).toBe('visible');
    
    fireEvent.click(toggleBtn);
    expect(shell.getAttribute('data-state')).toBe('minimizado');
    
    fireEvent.click(toggleBtn);
    expect(shell.getAttribute('data-state')).toBe('restaurado');
    
    // Validamos que sessionStorage / localStorage se mantengan limpios
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
