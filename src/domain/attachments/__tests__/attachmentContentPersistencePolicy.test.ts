import { describe, it, expect } from 'vitest';
import { attachmentContentPersistencePolicy } from '../attachmentContentPersistencePolicy';
import type { AttachmentContentPersistenceRecord } from '../attachmentContentPersistenceTypes';

describe('attachmentContentPersistencePolicy', () => {
  const validRecord: AttachmentContentPersistenceRecord = {
    attachmentId: 'att-1',
    ownerType: 'enti',
    ownerId: 'enti-1',
    chatId: 'chat-1',
    scope: 'enti_chat',
    contentText: 'hello',
    readAt: new Date().toISOString()
  };

  it('validates a valid record', () => {
    const result = attachmentContentPersistencePolicy(validRecord);
    expect(result).toEqual({ status: 'valid' });
  });

  it('blocks non objects', () => {
    expect(attachmentContentPersistencePolicy(null).status).toBe('blocked');
    expect(attachmentContentPersistencePolicy(123).status).toBe('blocked');
    expect(attachmentContentPersistencePolicy('string').status).toBe('blocked');
  });

  it('blocks missing attachmentId', () => {
    const result = attachmentContentPersistencePolicy({ ...validRecord, attachmentId: undefined });
    expect(result.status).toBe('blocked');
  });

  it('blocks missing ownerType', () => {
    const result = attachmentContentPersistencePolicy({ ...validRecord, ownerType: undefined });
    expect(result.status).toBe('blocked');
  });

  it('blocks invalid ownerType', () => {
    const result = attachmentContentPersistencePolicy({ ...validRecord, ownerType: 'invalid' });
    expect(result.status).toBe('blocked');
  });

  it('blocks missing ownerId', () => {
    const result = attachmentContentPersistencePolicy({ ...validRecord, ownerId: undefined });
    expect(result.status).toBe('blocked');
  });

  it('blocks missing scope', () => {
    const result = attachmentContentPersistencePolicy({ ...validRecord, scope: undefined });
    expect(result.status).toBe('blocked');
  });

  it('blocks missing contentText', () => {
    const result = attachmentContentPersistencePolicy({ ...validRecord, contentText: undefined });
    expect(result.status).toBe('blocked');
  });

  it('blocks enti_chat without chatId', () => {
    const result = attachmentContentPersistencePolicy({ ...validRecord, chatId: undefined });
    expect(result.status).toBe('blocked');
  });

  it('blocks group_chat without chatId', () => {
    const result = attachmentContentPersistencePolicy({ ...validRecord, scope: 'group_chat', ownerType: 'group', chatId: undefined });
    expect(result.status).toBe('blocked');
  });

  it('blocks enti_knowledge with chatId', () => {
    const result = attachmentContentPersistencePolicy({ ...validRecord, scope: 'enti_knowledge', chatId: 'chat-1' });
    expect(result.status).toBe('blocked');
  });

  it('blocks enti_chat with ownerType group', () => {
    const result = attachmentContentPersistencePolicy({ ...validRecord, ownerType: 'group' });
    expect(result.status).toBe('blocked');
  });

  it('blocks forbidden keys', () => {
    const result = attachmentContentPersistencePolicy({ ...validRecord, file: {} });
    expect(result.status).toBe('blocked');
    
    const result2 = attachmentContentPersistencePolicy({ ...validRecord, blob: {} });
    expect(result2.status).toBe('blocked');
  });
});
