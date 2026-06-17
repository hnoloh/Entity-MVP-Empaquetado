import { describe, it, expect } from 'vitest';
import { buildGroupAttachmentRuntimeContext } from '../buildGroupAttachmentRuntimeContext';
import type { ReadAttachmentAsContextResult } from '../../../attachments';

describe('buildGroupAttachmentRuntimeContext', () => {
  it('builds success block', () => {
    const result: ReadAttachmentAsContextResult = {
      status: 'success',
      content: {
        attachmentId: 'att-1',
        ownerType: 'group',
        ownerId: 'group-1',
        chatId: 'chat-1',
        sourceName: 'test.txt',
        contentText: 'Hello'
      }
    };
    const { item, error } = buildGroupAttachmentRuntimeContext('att-1', 'group-1', 'chat-1', result);
    expect(item).toBeDefined();
    expect(error).toBeUndefined();
    expect(item?.status).toBe('success');
    expect(item?.contentText).toBe('Hello');
  });

  it('builds blocked error', () => {
    const result: ReadAttachmentAsContextResult = { status: 'blocked', reason: 'Mismatch' };
    const { item, error } = buildGroupAttachmentRuntimeContext('att-2', 'group-1', 'chat-1', result);
    expect(item).toBeUndefined();
    expect(error).toBeDefined();
    expect(error?.status).toBe('blocked');
    expect(error?.reason).toBe('Mismatch');
  });

  it('builds controlled_error error', () => {
    const result: ReadAttachmentAsContextResult = { status: 'controlled_error', error: 'empty_content', reason: 'Empty' };
    const { item, error } = buildGroupAttachmentRuntimeContext('att-3', 'group-1', 'chat-1', result);
    expect(item).toBeUndefined();
    expect(error).toBeDefined();
    expect(error?.status).toBe('controlled_error');
    expect(error?.errorCode).toBe('empty_content');
  });
});
