import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { GeneratedArtifactActions } from '../GeneratedArtifactActions';
import { generatedArtifactAccessResolver } from '../../../domain/tools/generated-artifacts';

vi.mock('../../../domain/tools/generated-artifacts', () => ({
  generatedArtifactAccessResolver: {
    resolveDownload: vi.fn(),
    resolveOpen: vi.fn()
  }
}));

describe('GeneratedArtifactActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra texto cargando por defecto si no ha resuelto', async () => {
    vi.mocked(generatedArtifactAccessResolver.resolveDownload).mockImplementation(() => {
      throw new Error('Pending');
    });
    render(<GeneratedArtifactActions artifactId="art-1" entiId="enti-1" text="Mi enlace" />);
    expect(await screen.findByText('[Error de acceso: Pending]')).toBeDefined();
  });

  it('muestra botones de descargar y abrir tras resolucion exitosa', async () => {
    vi.mocked(generatedArtifactAccessResolver.resolveDownload).mockReturnValue({
      artifactId: 'art-1',
      filename: 'doc.pdf',
      mimeType: 'application/pdf',
      extension: '.pdf',
      owner: 'enti-1',
      isDownloadable: true
    });
    vi.mocked(generatedArtifactAccessResolver.resolveOpen).mockReturnValue({
      descriptor: { artifactId: 'art-1', objectUrl: 'blob:test', mimeType: 'application/pdf' },
      revoke: vi.fn()
    });

    render(<GeneratedArtifactActions artifactId="art-1" entiId="enti-1" text="Descargar dias.docx" />);
    const link = await screen.findByRole('link', { name: 'Descargar dias.docx' }) as HTMLAnchorElement;
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toContain('blob:test');
    expect(link.download).toBe('doc.pdf');
  });
});
