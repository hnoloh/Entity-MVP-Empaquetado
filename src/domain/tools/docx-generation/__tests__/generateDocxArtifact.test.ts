import { describe, it, expect } from 'vitest';
import { generateDocxArtifact } from '../generateDocxArtifact';

describe('generateDocxArtifact', () => {
  it('genera un artefacto con mime document DOCX', () => {
    const artifact = generateDocxArtifact('enti-1', 't1', 'hello', 'test');
    expect(artifact.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(artifact.filename).toBe('test.docx');
    expect(artifact.entiId).toBe('enti-1');
    expect(artifact.blob).toBeInstanceOf(Blob);
    expect(artifact.blob?.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(artifact.status).toBe('success');
  });
});
