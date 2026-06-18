import { describe, it, expect } from 'vitest';
import { attachmentPhysicalReadPolicy, MAX_TEXT_FILE_SIZE_BYTES } from '../attachmentPhysicalReadPolicy';
import type { ContextualSourceDescriptor } from '../contextualSourceTypes';

describe('attachmentPhysicalReadPolicy', () => {
  const validDescriptor: ContextualSourceDescriptor = {
    attachmentId: 'att-1',
    ownerType: 'enti',
    ownerId: 'enti-1',
    chatId: 'chat-1',
    scope: 'chat',
    fileName: 'test.txt',
    fileExtension: 'txt'
  };

  it('validates a correct text descriptor', () => {
    const result = attachmentPhysicalReadPolicy(validDescriptor);
    expect(result).toEqual({ status: 'valid' });
  });

  it('blocks missing owner', () => {
    const result = attachmentPhysicalReadPolicy({
      ...validDescriptor,
      ownerId: undefined as unknown as string
    });
    expect(result.status).toBeUndefined();
    if ('readStatus' in result) {
      expect(result.readStatus).toBe('blocked');
      expect(result.errorCode).toBe('missing_owner');
    }
  });

  it('blocks missing scope', () => {
    const result = attachmentPhysicalReadPolicy({
      ...validDescriptor,
      scope: undefined as unknown as "chat" | "enti_knowledge" | "enti_work_material"
    });
    expect(result.status).toBeUndefined();
    if ('readStatus' in result) {
      expect(result.readStatus).toBe('blocked');
      expect(result.errorCode).toBe('missing_scope');
    }
  });

  it('blocks unsupported extension', () => {
    const result = attachmentPhysicalReadPolicy({
      ...validDescriptor,
      fileExtension: 'exe',
      mimeType: 'application/octet-stream'
    });
    expect(result.status).toBeUndefined();
    if ('readStatus' in result) {
      expect(result.readStatus).toBe('blocked');
      expect(result.errorCode).toBe('unsupported_type');
    }
  });

  it('allows supported mime type without extension', () => {
    const result = attachmentPhysicalReadPolicy({
      ...validDescriptor,
      fileExtension: undefined,
      mimeType: 'text/plain'
    });
    expect(result).toEqual({ status: 'valid' });
  });

  it('blocks files exceeding size limit', () => {
    const result = attachmentPhysicalReadPolicy(validDescriptor, MAX_TEXT_FILE_SIZE_BYTES + 1);
    expect(result.status).toBeUndefined();
    if ('readStatus' in result) {
      expect(result.readStatus).toBe('blocked');
      expect(result.errorCode).toBe('size_limit_exceeded');
    }
  });
});
