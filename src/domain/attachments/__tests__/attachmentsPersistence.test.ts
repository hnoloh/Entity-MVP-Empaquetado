/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import {
  persistAttachmentRecordsFlow,
  restoreAttachmentRecordsFlow
} from '../attachmentsPersistence';
import type { Attachment } from '../attachmentModel';

describe('attachmentsPersistence', () => {
  const entiAttachment = {
    attachmentId: 'att-1',
    ownerType: 'enti' as const,
    ownerId: 'enti-1',
    chatId: 'chat-1',
    fileName: 'test.pdf',
    fileExtension: 'pdf' as const,
    status: 'received' as const,
    source: 'user_upload' as const,
    receivedAt: '2023-01-01T00:00:00Z'
  };

  const groupAttachment = {
    attachmentId: 'att-2',
    ownerType: 'group' as const,
    ownerId: 'group-1',
    chatId: 'chat-2',
    fileName: 'data.csv',
    mimeType: 'text/csv',
    source: 'user_upload' as const,
    receivedAt: '2023-01-01T00:00:00Z',
    fileExtension: 'txt' as const,
    status: 'received' as const
  };

  it('persist enti attachment', () => {
    const result = persistAttachmentRecordsFlow([entiAttachment]);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.payload.records).toHaveLength(1);
      expect(result.payload.records[0].ownerType).toBe('enti');
      expect(result.payload.records[0].attachmentId).toBe('att-1');
    }
  });

  it('restore enti attachment', () => {
    const payload = {
      records: [
        {
          attachmentId: 'att-1',
          ownerType: 'enti' as const,
          ownerId: 'enti-1',
          chatId: 'chat-1',
          fileName: 'test.pdf'
        }
      ]
    };
    const result = restoreAttachmentRecordsFlow(payload);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0].ownerType).toBe('enti');
      expect(result.attachments[0].fileName).toBe('test.pdf');
    }
  });

  it('persist group attachment', () => {
    const result = persistAttachmentRecordsFlow([groupAttachment]);
    expect(result.status).toBe('success');
  });

  it('restore group attachment', () => {
    const payload = {
      records: [
        {
          attachmentId: 'att-2',
          ownerType: 'group' as const,
          ownerId: 'group-1',
          chatId: 'chat-2'
        }
      ]
    };
    const result = restoreAttachmentRecordsFlow(payload);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.attachments[0].ownerType).toBe('group');
    }
  });

  it('round-trip mixed records', () => {
    const resultPersist = persistAttachmentRecordsFlow([entiAttachment, groupAttachment]);
    expect(resultPersist.status).toBe('success');
    if (resultPersist.status === 'success') {
      const resultRestore = restoreAttachmentRecordsFlow(resultPersist.payload);
      expect(resultRestore.status).toBe('success');
      if (resultRestore.status === 'success') {
        expect(resultRestore.attachments).toHaveLength(2);
        expect(resultRestore.attachments[0].ownerType).toBe('enti');
        expect(resultRestore.attachments[1].ownerType).toBe('group');
      }
    }
  });

  it('metadata preservation', () => {
    const att: Attachment = {
      ...entiAttachment,
      sizeBytes: 1024,
      status: 'readable'
    } as any;
    const result = persistAttachmentRecordsFlow([att]);
    if (result.status === 'success') {
      expect(result.payload.records[0].sizeBytes).toBe(1024);
    }
  });

  it('missing attachmentId', () => {
    const att = { ...entiAttachment, attachmentId: '' };
    const result = persistAttachmentRecordsFlow([att]);
    expect(result.status).toBe('blocked');
  });

  it('missing owner/chat', () => {
    const att1 = { ...entiAttachment, ownerId: '' };
    expect(persistAttachmentRecordsFlow([att1]).status).toBe('blocked');

    const att2 = { ...entiAttachment, chatId: '' };
    expect(persistAttachmentRecordsFlow([att2]).status).toBe('blocked');
  });

  it('forbidden content fields', () => {
    const att = { ...entiAttachment, content: 'some text' } as any;
    const result = persistAttachmentRecordsFlow([att]);
    expect(result.status).toBe('blocked');
  });

  it('invalid ownerType', () => {
    const att = { ...entiAttachment, ownerType: 'invalid' } as any;
    const result = persistAttachmentRecordsFlow([att]);
    expect(result.status).toBe('blocked');
  });

  it('restore with invalid payload', () => {
    expect(restoreAttachmentRecordsFlow(null as any).status).toBe('controlled_error');
    expect(restoreAttachmentRecordsFlow({ records: 'not an array' }).status).toBe('controlled_error');
  });
});
