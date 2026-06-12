import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';

describe('WorkspaceShell', () => {
  it('1. Render de WorkspaceShell', () => {
    const { container } = render(<WorkspaceShell />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('2. Presencia de EntitiesColumnRegion', () => {
    render(<WorkspaceShell />);
    expect(screen.getByTestId('entities-column-region')).toBeInTheDocument();
  });

  it('3. Presencia de WorkbenchRegion', () => {
    render(<WorkspaceShell />);
    expect(screen.getByTestId('workbench-region')).toBeInTheDocument();
  });

  it('4. Ausencia de ChatRegion, ChatView, ChatWindow o equivalentes dentro de WorkspaceShell', () => {
    const { container } = render(<WorkspaceShell />);
    const html = container.innerHTML.toLowerCase();
    expect(html).not.toContain('chat');
  });

  it('5. Estado inicial visible', () => {
    render(<WorkspaceShell />);
    const shell = screen.getByTestId('workspace-shell');
    expect(shell).toHaveAttribute('data-state', 'visible');
  });

  it('6 & 7 & 8. Transición de sesión minimizado y restaurado sin destrucción de regiones', () => {
    render(<WorkspaceShell />);
    const shell = screen.getByTestId('workspace-shell');
    const toggleBtn = screen.getByTestId('toggle-state-btn');
    
    // Inicial
    expect(shell).toHaveAttribute('data-state', 'visible');
    expect(screen.getByTestId('entities-column-region')).toBeInTheDocument();
    
    // Minimizar
    fireEvent.click(toggleBtn);
    expect(shell).toHaveAttribute('data-state', 'minimizado');
    // Las regiones deben seguir existiendo en el DOM, tal vez ocultas por CSS
    expect(screen.getByTestId('entities-column-region')).toBeInTheDocument();
    expect(screen.getByTestId('workbench-region')).toBeInTheDocument();
    
    // Restaurar
    fireEvent.click(toggleBtn);
    expect(shell).toHaveAttribute('data-state', 'restaurado');
    expect(screen.getByTestId('entities-column-region')).toBeInTheDocument();
  });

  it('10. No creación de múltiples Workspaces', () => {
    const { container } = render(<WorkspaceShell />);
    const workspaces = container.querySelectorAll('[data-testid="workspace-shell"]');
    expect(workspaces.length).toBe(1);
  });
});
