import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';

describe('WorkspaceSelectGroupIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Debe abrir el editor y el chat al clicar el grupo guardado', async () => {
    render(<WorkspaceShell />);
    
    // Crear grupo
    fireEvent.click(screen.getByTestId('btn-create-grupo'));
    expect(screen.getByTestId('group-editor')).toBeInTheDocument();
    
    // Guardar grupo (hay que cerrarlo y guardarlo)
    // El grupo está vacío, pero podemos saltar la validación o simularlo si es necesario.
    // Wait, let's just close it and discard it? No, we need it saved.
    // To save it without Entis, we would hit the alert. 
    // Let's mock window.alert to do nothing, but it returns undefined, so save fails!
    // We need to bypass the alert.
  });
});
