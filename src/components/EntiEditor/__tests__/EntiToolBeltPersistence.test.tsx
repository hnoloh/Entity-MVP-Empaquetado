
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { EntiToolBelt } from '../EntiToolBelt';
import { toolAuthorizationRepository } from '../../../domain/tools/toolAuthorizationRepository';

describe('EntiToolBelt Persistence Integration', () => {
  beforeEach(() => {
    toolAuthorizationRepository.clear();
  });

  it('refleja estado autorizado si ya está en el repositorio al montar', () => {
    toolAuthorizationRepository.save([
      { entiId: 'enti-123', toolId: 'tool-read-doc', state: 'authorized' }
    ]);

    render(<EntiToolBelt entiId="enti-123" />);

    const icon = screen.getByTestId('tool-icon-tool-read-doc');
    expect(icon.className).toContain('state-authorized');
  });

  it('actualiza el repositorio al interactuar en la UI', () => {
    render(<EntiToolBelt entiId="enti-123" />);

    // Click to open dropdown
    const label = screen.getByText('Herramientas');
    fireEvent.click(label);

    const pdfItem = screen.getByText('Generar PDF').closest('li');
    expect(pdfItem).not.toBeNull();
    fireEvent.click(pdfItem!);

    const auths = toolAuthorizationRepository.list();
    expect(auths).toHaveLength(1);
    expect(auths[0].toolId).toBe('tool-gen-pdf');
  });
});
