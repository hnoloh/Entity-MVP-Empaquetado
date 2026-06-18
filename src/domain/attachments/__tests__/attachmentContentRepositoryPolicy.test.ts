import { describe, it, expect } from 'vitest';
import { attachmentContentRepositoryPolicy } from '../attachmentContentRepositoryPolicy';
import type { AttachmentContentRepositoryEntry, AttachmentContentRepositoryKey } from '../attachmentContentRepositoryTypes';
import { MAX_TEXT_FILE_SIZE_BYTES } from '../attachmentPhysicalReadPolicy';

describe('attachmentContentRepositoryPolicy', () => {
  const validKey: AttachmentContentRepositoryKey = {
    attachmentId: 'att-1',
    ownerType: 'enti',
    ownerId: 'enti-1',
    chatId: 'chat-1',
    scope: 'enti_chat'
  };

  const validEntry: AttachmentContentRepositoryEntry = {
    ...validKey,
    contentText: 'Hello world',
    readAt: new Date().toISOString()
  };

  it('validates a valid key', () => {
    const result = attachmentContentRepositoryPolicy(validKey);
    expect(result).toEqual({ status: 'valid' });
  });

  it('validates a valid entry', () => {
    const result = attachmentContentRepositoryPolicy(validEntry);
    expect(result).toEqual({ status: 'valid' });
  });

  it('blocks missing attachmentId', () => {
    const result = attachmentContentRepositoryPolicy({ ...validKey, attachmentId: '' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('attachmentId');
  });

  it('blocks missing ownerType', () => {
    const result = attachmentContentRepositoryPolicy({ ...validKey, ownerType: undefined as unknown as "enti" | "group" });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('ownerType');
  });

  it('blocks invalid ownerType', () => {
    const result = attachmentContentRepositoryPolicy({ ...validKey, ownerType: 'user' as unknown as "enti" | "group" });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('ownerType');
  });

  it('blocks missing ownerId', () => {
    const result = attachmentContentRepositoryPolicy({ ...validKey, ownerId: '' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('ownerId');
  });

  it('blocks missing scope', () => {
    const result = attachmentContentRepositoryPolicy({ ...validKey, scope: undefined as unknown as "enti_chat" });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('scope');
  });

  it('blocks enti_chat without chatId', () => {
    const result = attachmentContentRepositoryPolicy({ ...validKey, chatId: undefined });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('chatId');
  });

  it('blocks enti_chat with group owner', () => {
    const result = attachmentContentRepositoryPolicy({ ...validKey, ownerType: 'group' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('ownerType enti');
  });

  it('blocks group_chat with enti owner', () => {
    const result = attachmentContentRepositoryPolicy({
      ...validKey,
      ownerType: 'enti',
      scope: 'group_chat'
    });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('ownerType group');
  });

  it('blocks enti_knowledge with group owner', () => {
    const result = attachmentContentRepositoryPolicy({
      ...validKey,
      ownerType: 'group',
      scope: 'enti_knowledge'
    });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('ownerType enti');
  });

  it('blocks enti_knowledge with chatId', () => {
    const result = attachmentContentRepositoryPolicy({
      ...validKey,
      ownerType: 'enti',
      scope: 'enti_knowledge',
      chatId: 'chat-1'
    });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('must not have chatId');
  });

  it('blocks contentText exceeding size limit', () => {
    const largeText = 'a'.repeat(MAX_TEXT_FILE_SIZE_BYTES + 1);
    const result = attachmentContentRepositoryPolicy({ ...validEntry, contentText: largeText });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('exceeds limit');
  });

  it('blocks forbidden objects (file, blob)', () => {
    const result = attachmentContentRepositoryPolicy({ ...validEntry, file: new File([], 'test') } as unknown as AttachmentContentRepositoryEntry);
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('Forbidden');
  });
});
