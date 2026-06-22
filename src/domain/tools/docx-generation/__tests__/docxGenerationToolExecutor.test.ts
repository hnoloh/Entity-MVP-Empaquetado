/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocxGenerationToolExecutor } from '../docxGenerationToolExecutor';
import { DocxGenerationPolicy } from '../docxGenerationPolicy';
import { InMemoryGeneratedArtifactRegistry } from '../../generated-artifacts';

describe('DocxGenerationToolExecutor', () => {
  let executor: DocxGenerationToolExecutor;
  let policy: DocxGenerationPolicy;
  let registry: InMemoryGeneratedArtifactRegistry;
  let indicators: { setIndicator: unknown };

  beforeEach(() => {
    policy = { validate: vi.fn() } as unknown as DocxGenerationPolicy;
    registry = new InMemoryGeneratedArtifactRegistry();
    indicators = { setIndicator: vi.fn() };
    executor = new DocxGenerationToolExecutor(policy, registry, indicators as any);
  });

  it('ejecuta con exito DOCX', async () => {
    vi.mocked(policy.validate).mockReturnValue({ allowed: true });
    const result = await executor.execute({ entiId: 'enti-1', toolId: 't1', content: 'hi', filename: 'a.docx' });
    expect(result.status).toBe('success');
    expect(result.artifactId).toBeDefined();
    expect(registry.getArtifactsByEnti('enti-1').length).toBe(1);
    expect((indicators as any).setIndicator).toHaveBeenCalledWith('enti-1', 't1', 'active');
  });

  it('devuelve blocked si policy falla para DOCX', async () => {
    vi.mocked(policy.validate).mockReturnValue({ allowed: false, reason: 'test_reason' });
    const result = await executor.execute({ entiId: 'enti-1', toolId: 't1', content: 'hi', filename: 'a.docx' });
    expect(result.status).toBe('blocked');
    expect(result.errorReason).toBe('test_reason');
    expect((indicators as any).setIndicator).toHaveBeenCalledWith('enti-1', 't1', 'blocked');
  });
});
