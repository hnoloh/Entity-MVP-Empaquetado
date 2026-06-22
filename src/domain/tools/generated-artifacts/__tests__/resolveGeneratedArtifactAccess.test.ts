/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeneratedArtifactAccessResolver } from '../resolveGeneratedArtifactAccess';
import type { GeneratedArtifactAccessPolicy } from '../generatedArtifactAccessPolicy';

vi.mock('../buildGeneratedArtifactObjectUrl', () => ({
  buildGeneratedArtifactObjectUrl: vi.fn(() => ({ url: 'mock-url', revoke: vi.fn() }))
}));

describe('GeneratedArtifactAccessResolver', () => {
  let mockPolicy: GeneratedArtifactAccessPolicy;
  let resolver: GeneratedArtifactAccessResolver;

  beforeEach(() => {
    mockPolicy = {
      canAccess: vi.fn()
    } as unknown as GeneratedArtifactAccessPolicy;
    resolver = new GeneratedArtifactAccessResolver(mockPolicy);
  });

  it('resuelve download descriptor', () => {
    vi.mocked(mockPolicy.canAccess).mockReturnValue({
      allowed: true,
      artifact: { artifactId: '1', filename: 'doc.pdf', mimeType: 'application/pdf', entiId: 'enti-1' }
    } as any);

    const desc = resolver.resolveDownload('1', 'enti-1');
    expect(desc.artifactId).toBe('1');
    expect(desc.extension).toBe('.pdf');
  });

  it('resuelve open descriptor y revoke', () => {
    vi.mocked(mockPolicy.canAccess).mockReturnValue({
      allowed: true,
      artifact: { artifactId: '1', filename: 'doc.pdf', mimeType: 'application/pdf', entiId: 'enti-1' }
    } as any);

    const { descriptor, revoke } = resolver.resolveOpen('1', 'enti-1');
    expect(descriptor.objectUrl).toBe('mock-url');
    expect(typeof revoke).toBe('function');
  });

  it('lanza error si access denegado', () => {
    vi.mocked(mockPolicy.canAccess).mockReturnValue({ allowed: false, reason: 'test_reason' });
    expect(() => resolver.resolveDownload('1', 'enti-1')).toThrow('Access denied: test_reason');
  });
});
