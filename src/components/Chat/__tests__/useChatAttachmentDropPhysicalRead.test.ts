import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatAttachmentDrop } from '../useChatAttachmentDrop';
import { attachmentContentRepository } from '../../../domain/attachments/attachmentContentRepository';
import { attachmentsStore } from '../attachmentsStore';

describe('useChatAttachmentDropPhysicalRead', () => {
  beforeEach(() => {
    attachmentContentRepository.clear();
    attachmentsStore.clear();
    vi.useFakeTimers();
  });

  it('reads a valid text file and upserts to repository', async () => {
    const { result } = renderHook(() => useChatAttachmentDrop('enti', 'enti-1', 'chat-1'));

    const file = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', getAsFile: () => file }]
    };

    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handlers.onDrop(event);
    });

    // Check store
    const attachments = attachmentsStore.getAttachmentsForChat('chat-1');
    expect(attachments.length).toBe(1);
    const attachmentId = attachments[0].attachmentId;

    // Check repo
    const getReq = {
      attachmentId,
      ownerType: 'enti' as const,
      ownerId: 'enti-1',
      chatId: 'chat-1',
      scope: 'enti_chat' as const
    };
    const repoResult = attachmentContentRepository.get(getReq);
    expect(repoResult.status).toBe('success');
    if (repoResult.status === 'success' && 'entry' in repoResult && repoResult.entry) {
      expect(repoResult.entry.contentText).toBe('Hello World');
    }
  });

  it('blocks reading of invalid file type', async () => {
    const { result } = renderHook(() => useChatAttachmentDrop('enti', 'enti-1', 'chat-1'));

    const file = new File(['binary'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', getAsFile: () => file }]
    };

    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handlers.onDrop(event);
    });

    expect(result.current.dropState).toBe('error');
    expect(result.current.errorMessage).toContain('Unsupported file type');

    const attachments = attachmentsStore.getAttachmentsForChat('chat-1');
    expect(attachments.length).toBe(0); // Should not be persisted if blocked
  });
});
