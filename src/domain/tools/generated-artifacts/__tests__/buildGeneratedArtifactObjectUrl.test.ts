import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildGeneratedArtifactObjectUrl } from '../buildGeneratedArtifactObjectUrl';
import type { GeneratedToolArtifact } from '../generatedArtifactTypes';

describe('buildGeneratedArtifactObjectUrl', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('construye una object url desde el blob y devuelve funcion revoke', () => {
    const artifact = { blob: new Blob(['test']) } as GeneratedToolArtifact;
    const { url, revoke } = buildGeneratedArtifactObjectUrl(artifact);
    
    expect(url).toBe('blob:test-url');
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(artifact.blob);
    
    revoke();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('falla si no hay blob', () => {
    const artifact = {} as GeneratedToolArtifact;
    expect(() => buildGeneratedArtifactObjectUrl(artifact)).toThrow('Artifact has no binary content');
  });
});
