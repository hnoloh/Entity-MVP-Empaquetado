import { describe, it, expect } from 'vitest';
import { buildAttachmentDropIntent } from '../buildAttachmentDropIntent';

describe('buildAttachmentDropIntent', () => {
  it('extracts metadata correctly', () => {
    const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    const intent = buildAttachmentDropIntent(file, 'enti', 'enti-1', 'chat-1');

    expect(intent.ownerType).toBe('enti');
    expect(intent.ownerId).toBe('enti-1');
    expect(intent.chatId).toBe('chat-1');
    expect(intent.metadata.fileName).toBe('document.pdf');
    expect(intent.metadata.fileExtension).toBe('pdf');
    expect(intent.metadata.mimeType).toBe('application/pdf');
    expect(intent.metadata.source).toBe('drag_and_drop');
  });

  it('handles missing extension', () => {
    const file = new File(['content'], 'document', { type: 'application/octet-stream' });
    const intent = buildAttachmentDropIntent(file, 'group', 'group-1', 'chat-2');

    expect(intent.ownerType).toBe('group');
    expect(intent.metadata.fileName).toBe('document');
    expect(intent.metadata.fileExtension).toBe('');
    expect(intent.metadata.mimeType).toBe('application/octet-stream');
  });
});
