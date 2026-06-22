import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PdfGenerationPolicy } from '../pdfGenerationPolicy';
import type { ToolAuthorizationRepository } from '../../toolAuthorizationRepository';

describe('PdfGenerationPolicy', () => {
  let mockAuthRepo: ToolAuthorizationRepository;
  let policy: PdfGenerationPolicy;

  beforeEach(() => {
    mockAuthRepo = {
      isToolAuthorized: vi.fn(),
      getAuthorizations: vi.fn(),
      setAuthorization: vi.fn()
    } as unknown as ToolAuthorizationRepository;
    policy = new PdfGenerationPolicy(mockAuthRepo);
  });

  it('permite generar PDF si esta autorizado y cumple requisitos', () => {
    vi.mocked(mockAuthRepo.isToolAuthorized).mockReturnValue(true);
    const result = policy.validate({ entiId: 'enti-1', toolId: 't1', content: 'hello', filename: 'doc.pdf' });
    expect(result).toEqual({ allowed: true });
  });

  it('allows empty content per user override', () => {
    vi.mocked(mockAuthRepo.isToolAuthorized).mockReturnValue(true);
    expect(policy.validate({ entiId: 'enti-1', toolId: 't1', content: '', filename: 'doc.pdf' })).toEqual({ allowed: true });
    expect(policy.validate({ entiId: 'enti-1', toolId: 't1', content: '   ', filename: 'doc.pdf' })).toEqual({ allowed: true });
  });

  it('bloquea si owner es group', () => {
    const result = policy.validate({ entiId: 'group-1', toolId: 't1', content: 'hello', filename: 'doc.pdf' });
    expect(result).toEqual({ allowed: false, reason: 'group_owner_not_allowed' });
  });

  it('bloquea si no esta autorizado', () => {
    vi.mocked(mockAuthRepo.isToolAuthorized).mockReturnValue(false);
    const result = policy.validate({ entiId: 'enti-1', toolId: 't1', content: 'hello', filename: 'doc.pdf' });
    expect(result).toEqual({ allowed: false, reason: 'tool_not_authorized' });
  });

  it('bloquea extension invalida o path traversal', () => {
    vi.mocked(mockAuthRepo.isToolAuthorized).mockReturnValue(true);
    expect(policy.validate({ entiId: 'enti-1', toolId: 't1', content: 'hello', filename: '../doc.pdf' }).allowed).toBe(false);
    expect(policy.validate({ entiId: 'enti-1', toolId: 't1', content: 'hello', filename: 'doc.txt' }).allowed).toBe(false);
  });
});
