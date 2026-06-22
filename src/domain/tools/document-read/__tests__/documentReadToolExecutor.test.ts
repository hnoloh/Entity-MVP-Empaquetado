import { describe, it, expect, beforeEach, vi } from 'vitest';
import { documentReadToolExecutor } from '../documentReadToolExecutor';
import { toolAuthorizationRepository } from '../../toolAuthorizationRepository';
import type { DocumentReadToolInput } from '../documentReadToolTypes';

// Mock the extractors to test executor logic without dealing with real ArrayBuffers
vi.mock('../extractPdfText', () => ({
  extractPdfText: vi.fn(async () => ({ rawText: 'mocked pdf content', normalizedText: 'mocked pdf content', wordCount: 3 }))
}));
vi.mock('../extractDocxText', () => ({
  extractDocxText: vi.fn(async () => ({ rawText: 'mocked docx content', normalizedText: 'mocked docx content', wordCount: 3 }))
}));

describe('documentReadToolExecutor', () => {
  beforeEach(() => {
    toolAuthorizationRepository.clear();
    vi.clearAllMocks();
  });

  const baseInput: DocumentReadToolInput = {
    entiId: 'enti-1',
    ownerType: 'enti',
    ownerId: 'enti-1',
    fileName: 'test.pdf',
    fileExtension: 'pdf',
    mimeType: 'application/pdf',
    fileRef: new File([''], 'test.pdf')
  };

  it('returns blocked if policy blocks', async () => {
    // Sin autorizar
    const result = await documentReadToolExecutor(baseInput);
    expect(result.status).toBe('blocked');
    expect(result.blockedReason).toBe('tool_not_active');
  });

  it('returns success and pdf content when authorized', async () => {
    toolAuthorizationRepository.save([{ entiId: 'enti-1', toolId: 'tool-read-doc', state: 'authorized' }]);
    
    const result = await documentReadToolExecutor(baseInput);
    
    expect(result.status).toBe('success');
    expect(result.content?.rawText).toBe('mocked pdf content');
  });

  it('returns success and docx content when authorized', async () => {
    toolAuthorizationRepository.save([{ entiId: 'enti-1', toolId: 'tool-read-doc', state: 'authorized' }]);
    
    const result = await documentReadToolExecutor({ ...baseInput, fileExtension: 'docx' });
    
    expect(result.status).toBe('success');
    expect(result.content?.rawText).toBe('mocked docx content');
  });

  it('returns blocked for invalid format even if authorized', async () => {
    toolAuthorizationRepository.save([{ entiId: 'enti-1', toolId: 'tool-read-doc', state: 'authorized' }]);
    
    const result = await documentReadToolExecutor({ ...baseInput, fileExtension: 'txt' });
    
    expect(result.status).toBe('blocked');
    expect(result.blockedReason).toBe('invalid_format');
  });
});
