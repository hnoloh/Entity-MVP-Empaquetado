import { describe, it, expect } from 'vitest';
import { buildEntiAttachmentRuntimeContext } from '../buildEntiAttachmentRuntimeContext';
import type { ReadAttachmentAsContextResult } from '../../../attachments';

describe('buildEntiAttachmentRuntimeContext', () => {
  it('builds success block', () => {
    const result: ReadAttachmentAsContextResult = {
      status: 'success',
      content: {
        attachmentId: 'att-1',
        ownerType: 'enti',
        ownerId: 'enti-1',
        chatId: 'chat-1',
        sourceName: 'test.txt',
        contentText: 'Hello'
      }
    };
    const block = buildEntiAttachmentRuntimeContext('att-1', result);
    expect(block.status).toBe('success');
    expect(block.attachmentId).toBe('att-1');
    expect(block.content?.contentText).toBe('Hello');
  });

  it('builds blocked block', () => {
    const result: ReadAttachmentAsContextResult = { status: 'blocked', reason: 'Mismatch' };
    const block = buildEntiAttachmentRuntimeContext('att-2', result);
    expect(block.status).toBe('blocked');
    expect(block.reason).toBe('Mismatch');
    expect(block.content).toBeUndefined();
  });

  it('builds controlled_error block', () => {
    const result: ReadAttachmentAsContextResult = { status: 'controlled_error', error: 'empty_content', reason: 'Empty' };
    const block = buildEntiAttachmentRuntimeContext('att-3', result);
    expect(block.status).toBe('controlled_error');
    expect(block.errorType).toBe('empty_content');
    expect(block.reason).toBe('Empty');
  });
});
