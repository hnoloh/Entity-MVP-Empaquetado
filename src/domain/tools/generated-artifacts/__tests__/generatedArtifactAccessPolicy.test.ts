/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeneratedArtifactAccessPolicy } from '../generatedArtifactAccessPolicy';
import type { GeneratedArtifactRegistry } from '../generatedArtifactRegistry';
import type { GeneratedToolArtifact } from '../generatedArtifactTypes';

describe('GeneratedArtifactAccessPolicy', () => {
  let mockRegistry: GeneratedArtifactRegistry;
  let policy: GeneratedArtifactAccessPolicy;

  beforeEach(() => {
    mockRegistry = {
      getArtifactById: vi.fn(),
      getArtifactsByEnti: vi.fn(),
      registerArtifact: vi.fn()
    };
    policy = new GeneratedArtifactAccessPolicy(mockRegistry as any);
  });

  it('permite acceso si todo es valido (pdf)', () => {
    vi.mocked(mockRegistry.getArtifactById).mockReturnValue({
      artifactId: 'art-1',
      entiId: 'enti-1',
      mimeType: 'application/pdf',
      status: 'success'
    } as GeneratedToolArtifact);
    
    const result = policy.canAccess('art-1', 'enti-1');
    expect(result.allowed).toBe(true);
  });

  it('permite acceso a html', () => {
    vi.mocked(mockRegistry.getArtifactById).mockReturnValue({
      artifactId: 'art-1',
      entiId: 'enti-1',
      mimeType: 'text/html',
      status: 'success'
    } as GeneratedToolArtifact);
    
    const result = policy.canAccess('art-1', 'enti-1');
    expect(result.allowed).toBe(true);
  });

  it('bloquea si el artefacto no existe', () => {
    vi.mocked(mockRegistry.getArtifactById).mockReturnValue(undefined);
    expect(policy.canAccess('art-1', 'enti-1').allowed).toBe(false);
  });

  it('bloquea si el owner no coincide', () => {
    vi.mocked(mockRegistry.getArtifactById).mockReturnValue({
      artifactId: 'art-1',
      entiId: 'enti-1',
      mimeType: 'application/pdf',
      status: 'success'
    } as GeneratedToolArtifact);
    expect(policy.canAccess('art-1', 'enti-other').allowed).toBe(false);
  });

  it('bloquea si el mime type no esta aprobado', () => {
    vi.mocked(mockRegistry.getArtifactById).mockReturnValue({
      artifactId: 'art-1',
      entiId: 'enti-1',
      mimeType: 'image/png', // not in ALLOWED_MIME_TYPES
      status: 'success'
    } as GeneratedToolArtifact);
    expect(policy.canAccess('art-1', 'enti-1').allowed).toBe(false);
  });
});
