import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryGeneratedArtifactRegistry } from '../generatedArtifactRegistry';
import type { GeneratedToolArtifact } from '../generatedArtifactTypes';

describe('InMemoryGeneratedArtifactRegistry', () => {
  let registry: InMemoryGeneratedArtifactRegistry;

  beforeEach(() => {
    registry = new InMemoryGeneratedArtifactRegistry();
  });

  it('debe registrar un artefacto válido', () => {
    const artifact: GeneratedToolArtifact = {
      artifactId: 'art-1',
      entiId: 'enti-1',
      toolId: 'tool-gen-pdf',
      mimeType: 'application/pdf',
      filename: 'test.pdf',
      status: 'success'
    };

    registry.registerArtifact(artifact);
    expect(registry.getArtifactById('art-1')).toEqual(artifact);
  });

  it('debe devolver artefactos por entiId aislado', () => {
    registry.registerArtifact({ artifactId: 'art-1', entiId: 'enti-1', toolId: 't1', mimeType: 'application/pdf', filename: '1.pdf', status: 'success' });
    registry.registerArtifact({ artifactId: 'art-2', entiId: 'enti-2', toolId: 't1', mimeType: 'application/pdf', filename: '2.pdf', status: 'success' });

    const enti1Artifacts = registry.getArtifactsByEnti('enti-1');
    expect(enti1Artifacts.length).toBe(1);
    expect(enti1Artifacts[0].artifactId).toBe('art-1');
  });

  it('debe rechazar registro sin entiId', () => {
    const artifact = { artifactId: 'art-3', entiId: '', toolId: 't1', mimeType: 'application/pdf', filename: '3.pdf', status: 'success' } as GeneratedToolArtifact;
    expect(() => registry.registerArtifact(artifact)).toThrow('entiId is required');
  });
});
