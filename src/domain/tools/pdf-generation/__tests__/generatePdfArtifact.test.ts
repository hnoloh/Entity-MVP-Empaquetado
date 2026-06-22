import { describe, it, expect } from 'vitest';
import { generatePdfArtifact } from '../generatePdfArtifact';

describe('generatePdfArtifact', () => {
  it('genera un artefacto con mime application/pdf', () => {
    const artifact = generatePdfArtifact('enti-1', 't1', 'hello', 'test');
    expect(artifact.mimeType).toBe('application/pdf');
    expect(artifact.filename).toBe('test.pdf');
    expect(artifact.entiId).toBe('enti-1');
    expect(artifact.blob).toBeInstanceOf(Blob);
    expect(artifact.blob?.type).toBe('application/pdf');
    expect(artifact.status).toBe('success');
  });
});
