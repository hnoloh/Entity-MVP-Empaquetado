import { describe, it, expect } from 'vitest';
import { serializeAttachmentContentRepositorySnapshot } from '../attachmentContentPersistenceSerializer';
import type { AttachmentContentRepositorySnapshot } from '../attachmentContentRepositoryTypes';

describe('serializeAttachmentContentRepositorySnapshot', () => {
  it('serializes a valid snapshot', () => {
    const snapshot: AttachmentContentRepositorySnapshot = {
      entries: [
        {
          attachmentId: 'att-1',
          ownerType: 'enti',
          ownerId: 'enti-1',
          chatId: 'chat-1',
          scope: 'enti_chat',
          contentText: 'hello',
          readAt: '2026-06-17T00:00:00.000Z',
          metadata: { foo: 'bar' }
        }
      ]
    };

    const records = serializeAttachmentContentRepositorySnapshot(snapshot);
    expect(records.length).toBe(1);
    expect(records[0].attachmentId).toBe('att-1');
    expect(records[0].metadata).toEqual({ foo: 'bar' });
  });

  it('filters out invalid entries', () => {
    const snapshot: AttachmentContentRepositorySnapshot = {
      entries: [
        {
          attachmentId: 'att-1',
          ownerType: 'enti',
          ownerId: 'enti-1',
          chatId: 'chat-1',
          scope: 'enti_chat',
          contentText: 'hello',
          readAt: '2026-06-17T00:00:00.000Z'
        },
        {
          attachmentId: 'att-2',
          ownerType: 'enti',
          ownerId: 'enti-1',
          // missing chatId for enti_chat!
          scope: 'enti_chat',
          contentText: 'hello invalid',
          readAt: '2026-06-17T00:00:00.000Z'
        }
      ]
    };

    const records = serializeAttachmentContentRepositorySnapshot(snapshot);
    expect(records.length).toBe(1);
    expect(records[0].attachmentId).toBe('att-1');
  });
});
