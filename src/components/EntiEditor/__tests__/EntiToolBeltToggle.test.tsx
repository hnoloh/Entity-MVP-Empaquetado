
import { render, screen, fireEvent } from '@testing-library/react';
import { EntiToolBelt } from '../EntiToolBelt';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MOCK_REGISTRY_BASE } from '../../../domain/tools/mockRegistry';

describe('EntiToolBelt Toggle UI', () => {
  beforeEach(() => {
    MOCK_REGISTRY_BASE.definitions['tool-internet'] = { id: 'tool-internet', kind: 'internet', name: 'Internet', description: 'Acceso a la web', riskLevel: 'critical' };
  });

  afterEach(() => {
    delete MOCK_REGISTRY_BASE.definitions['tool-internet'];
  });
  it('toggles a tool via UI and displays it as selected', () => {
    render(<EntiToolBelt entiId="enti-ui-test" />);
    
    // Click on "Herramientas" to open the dropdown
    const label = screen.getByText('Herramientas');
    fireEvent.click(label);
    
    // Find the available tool (Leer Documento)
    const readDocOption = screen.getByText('Leer Documento').closest('li');
    expect(readDocOption).toBeInTheDocument();
    
    // Click it to toggle
    fireEvent.click(readDocOption!);
    
    // Close the dropdown to simplify querying the active icon
    fireEvent.click(label);
    
    // Now the dropdown should be closed, and the tool icon should be visible near the label
    const activeToolIcon = screen.getByTitle('Leer Documento - Lee PDF/DOCX');
    expect(activeToolIcon).toBeInTheDocument();
    
    // Click the active tool icon to remove it
    fireEvent.click(activeToolIcon.querySelector('.tool-remove-btn')!);
    
    // Icon should be gone
    expect(screen.queryByTitle('Leer Documento - Lee PDF/DOCX')).not.toBeInTheDocument();
  });

  it('does not allow clicking a blocked tool', () => {
    render(<EntiToolBelt entiId="enti-ui-blocked-test" />);
    
    fireEvent.click(screen.getByText('Herramientas'));
    
    const netOption = screen.getByText('Internet').closest('li');
    expect(netOption).toBeInTheDocument();
    
    // Verify it is visually blocked and clicking does not close dropdown or add it
    expect(netOption).toHaveStyle({ cursor: 'not-allowed' });
    fireEvent.click(netOption!);
    
    // Should not add the active tool icon
    expect(screen.queryByTitle('Internet - Acceso a la web')).not.toBeInTheDocument();
  });
});
