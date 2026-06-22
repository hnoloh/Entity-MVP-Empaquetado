import { describe, it, expect, beforeEach } from 'vitest';
import { documentReadToolPolicy } from '../documentReadToolPolicy';
import { toolAuthorizationRepository } from '../../toolAuthorizationRepository';
import type { DocumentReadToolInput } from '../documentReadToolTypes';

describe('documentReadToolPolicy', () => {
  beforeEach(() => {
    toolAuthorizationRepository.clear();
  });

  const baseInput: DocumentReadToolInput = {
    entiId: 'enti-1',
    ownerType: 'enti',
    ownerId: 'enti-1',
    fileName: 'test.pdf',
    fileExtension: 'pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    fileRef: new File([''], 'test.pdf')
  };

  it('blocks if tool is not authorized', () => {
    const result = documentReadToolPolicy(baseInput);
    expect(result).toEqual({ status: 'blocked', reason: 'tool_not_active' });
  });

  it('validates authorized pdf file', () => {
    toolAuthorizationRepository.save([{ entiId: 'enti-1', toolId: 'tool-read-doc', state: 'authorized' }]);
    const result = documentReadToolPolicy(baseInput);
    expect(result).toEqual({ status: 'valid' });
  });

  it('validates authorized docx file', () => {
    toolAuthorizationRepository.save([{ entiId: 'enti-1', toolId: 'tool-read-doc', state: 'authorized' }]);
    const result = documentReadToolPolicy({ ...baseInput, fileExtension: 'docx', fileName: 'test.docx' });
    expect(result).toEqual({ status: 'valid' });
  });

  it('blocks if format is invalid', () => {
    toolAuthorizationRepository.save([{ entiId: 'enti-1', toolId: 'tool-read-doc', state: 'authorized' }]);
    const result = documentReadToolPolicy({ ...baseInput, fileExtension: 'txt' });
    expect(result).toEqual({ status: 'blocked', reason: 'invalid_format' });
  });

  it('blocks if ownerId is missing', () => {
    toolAuthorizationRepository.save([{ entiId: 'enti-1', toolId: 'tool-read-doc', state: 'authorized' }]);
    const result = documentReadToolPolicy({ ...baseInput, ownerId: '' });
    expect(result).toEqual({ status: 'blocked', reason: 'invalid_owner' });
  });

  it('blocks if size exceeds limit', () => {
    toolAuthorizationRepository.save([{ entiId: 'enti-1', toolId: 'tool-read-doc', state: 'authorized' }]);
    const result = documentReadToolPolicy({ ...baseInput, sizeBytes: 25 * 1024 * 1024 });
    expect(result).toEqual({ status: 'blocked', reason: 'file_too_large' });
  });
});
