import { describe, it, expect, vi } from 'vitest';
import { readAttachmentPhysicalTextContent } from '../readAttachmentPhysicalTextContent';
import type { ContextualSourceDescriptor } from '../contextualSourceTypes';

describe('readAttachmentPhysicalTextContent', () => {
  const validDescriptor: ContextualSourceDescriptor = {
    attachmentId: 'att-1',
    ownerType: 'enti',
    ownerId: 'enti-1',
    chatId: 'chat-1',
    scope: 'enti_knowledge',
    fileName: 'test.txt',
    fileExtension: 'txt'
  };

  it('reads content successfully from a File/Blob', async () => {
    const mockFile = {
      size: 100,
      text: vi.fn().mockResolvedValue('Hello World  ')
    } as unknown as File;

    const result = await readAttachmentPhysicalTextContent(validDescriptor, mockFile);

    expect(result.readStatus).toBe('success');
    if (result.readStatus === 'success') {
      expect(result.contentText).toBe('Hello World'); // trimmed
      expect(result.scope).toBe('enti_knowledge');
    }
  });

  it('blocks if no file reference is provided', async () => {
    const result = await readAttachmentPhysicalTextContent(validDescriptor, undefined);
    
    expect(result.readStatus).toBe('blocked');
    if (result.readStatus === 'blocked') {
      expect(result.errorCode).toBe('file_unavailable');
    }
  });

  it('blocks empty content', async () => {
    const mockFile = {
      size: 100,
      text: vi.fn().mockResolvedValue('   \n  ')
    } as unknown as File;

    const result = await readAttachmentPhysicalTextContent(validDescriptor, mockFile);

    expect(result.readStatus).toBe('blocked');
    if (result.readStatus === 'blocked') {
      expect(result.errorCode).toBe('empty_content');
    }
  });

  it('returns controlled error if text() throws', async () => {
    const mockFile = {
      size: 100,
      text: vi.fn().mockRejectedValue(new Error('Disk read error'))
    } as unknown as File;

    const result = await readAttachmentPhysicalTextContent(validDescriptor, mockFile);

    expect(result.readStatus).toBe('controlled_error');
    if (result.readStatus === 'controlled_error') {
      expect(result.errorCode).toBe('read_failed');
      expect(result.errorMessage).toBe('Disk read error');
    }
  });

  it('blocks if policy fails (e.g. invalid extension)', async () => {
    const invalidDescriptor = { ...validDescriptor, fileExtension: 'exe' };
    const mockFile = {
      size: 100,
      text: vi.fn().mockResolvedValue('some binary data')
    } as unknown as File;

    const result = await readAttachmentPhysicalTextContent(invalidDescriptor, mockFile);

    expect(result.readStatus).toBe('blocked');
    if (result.readStatus === 'blocked') {
      expect(result.errorCode).toBe('unsupported_type');
    }
    // Should not have called text()
    expect(mockFile.text).not.toHaveBeenCalled();
  });
});
