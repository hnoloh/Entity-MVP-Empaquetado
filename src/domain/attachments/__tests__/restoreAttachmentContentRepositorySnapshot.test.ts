import { describe, it, expect, beforeEach } from 'vitest';
import { restoreAttachmentContentRepositorySnapshot } from '../restoreAttachmentContentRepositorySnapshot';
import { attachmentContentRepository } from '../attachmentContentRepository';
import type { AttachmentContentPersistenceRecord } from '../attachmentContentPersistenceTypes';

describe('restoreAttachmentContentRepositorySnapshot', () => {
  beforeEach(() => {
    attachmentContentRepository.clear();
  });

  it('restores valid records and ignores invalid ones', () => {
    const validRecord: AttachmentContentPersistenceRecord = {
      attachmentId: 'att-1',
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      scope: 'enti_chat',
      contentText: 'hello',
      readAt: '2026-06-17T00:00:00.000Z'
    };

    const invalidRecord = {
      attachmentId: 'att-2',
      ownerType: 'enti',
      ownerId: 'enti-1',
      scope: 'enti_chat',
      contentText: 'hello invalid'
      // missing chatId
    };

    const result = restoreAttachmentContentRepositorySnapshot([validRecord, invalidRecord]);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.restoredCount).toBe(1);
      expect(result.errors).toBe(1);
    }

    const snapshot = attachmentContentRepository.snapshot();
    expect(snapshot.entries.length).toBe(1);
    expect(snapshot.entries[0].attachmentId).toBe('att-1');
  });

  it('handles non array input', () => {
    const result = restoreAttachmentContentRepositorySnapshot(null as unknown as unknown[]);
    expect(result.status).toBe('controlled_error');
  });
});
