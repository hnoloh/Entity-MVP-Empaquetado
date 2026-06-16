import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';

describe('WorkspaceGroupEditorOpeningIntegration - FIA-013', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST-FIA013-01: Crear grupo abre automáticamente el editor en estado borrador sin añadir a la columna', () => {
    render(<WorkspaceShell />);
    
    expect(screen.queryByTestId('group-editor')).not.toBeInTheDocument();
    
    const btnCreateGrupo = screen.getByTestId('btn-create-grupo');
    fireEvent.click(btnCreateGrupo);
    
    // No debe aparecer en la columna lateral
    expect(screen.queryByTestId(/^grupo-item-/)).not.toBeInTheDocument();
    
    // El editor debe estar abierto
    expect(screen.getByTestId('group-editor')).toBeInTheDocument();
    
    // La pestaña debe existir
    const tabs = screen.getAllByTestId(/^tab-item-grupo-/);
    expect(tabs.length).toBe(1);
  });

  it('TEST-FIA013-05: El editor recién abierto tiene los datos por defecto', () => {
    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByTestId('btn-create-grupo'));
    
    expect(screen.getByTestId('input-group-name')).toHaveValue('');
    expect(screen.getByTestId('input-group-name')).toHaveAttribute('placeholder', 'Nuevo Grupo');
    expect(screen.getByTestId('input-group-function')).toHaveValue('');
    expect(screen.getByTestId('select-slot-1')).toHaveTextContent('-- Sin Enti --');
  });
});
