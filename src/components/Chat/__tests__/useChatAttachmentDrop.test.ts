/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatAttachmentDrop } from '../useChatAttachmentDrop';
import * as attachmentsDomain from '../../../domain/attachments';
import { readAttachmentPhysicalTextContent } from '../../../domain/attachments/readAttachmentPhysicalTextContent';

vi.mock('../../../domain/attachments', () => ({
  createAttachmentModelFlow: vi.fn(),
  associateAttachmentToEntiChatFlow: vi.fn(),
  associateAttachmentToGroupChatFlow: vi.fn(),
  persistAttachmentRecordsFlow: vi.fn()
}));

vi.mock('../../../domain/attachments/readAttachmentPhysicalTextContent', () => ({
  readAttachmentPhysicalTextContent: vi.fn()
}));

vi.mock('../../../domain/tools/toolAuthorizationRepository', () => ({
  toolAuthorizationRepository: { list: vi.fn(() => [{ entiId: 'e1', toolId: 'tool-read-doc', state: 'authorized' }]) }
}));

vi.mock('../../../domain/tools/document-read', () => ({
  documentReadToolExecutor: vi.fn(async () => ({ status: 'success', content: { rawText: 'content' } }))
}));

describe('useChatAttachmentDrop', () => {
  it('initializes with idle state', () => {
    const { result } = renderHook(() => useChatAttachmentDrop('enti', 'e1', 'c1'));
    expect(result.current.dropState).toBe('idle');
  });

  it('sets dragging_blocked if missing ids on drag enter', () => {
    const { result } = renderHook(() => useChatAttachmentDrop(undefined, 'e1', 'c1'));
    act(() => {
      const e = { preventDefault: vi.fn(), stopPropagation: vi.fn(), dataTransfer: { items: [] } } as unknown as React.DragEvent;
      result.current.handlers.onDragEnter(e);
    });
    expect(result.current.dropState).toBe('dragging_blocked');
  });

  it('sets dragging_valid if valid file dragged', () => {
    const { result } = renderHook(() => useChatAttachmentDrop('enti', 'e1', 'c1'));
    act(() => {
      const e = { 
        preventDefault: vi.fn(), 
        stopPropagation: vi.fn(), 
        dataTransfer: { items: [{ kind: 'file' }] } 
      } as unknown as React.DragEvent;
      result.current.handlers.onDragEnter(e);
    });
    expect(result.current.dropState).toBe('dragging_valid');
  });

  it('processes drop and calls domain flows', async () => {
    const mockAttachment = { attachmentId: 'att1', ownerType: 'enti', ownerId: 'e1', chatId: 'c1', fileName: 'test.pdf', fileExtension: 'pdf', mimeType: 'application/pdf' };
    vi.mocked(attachmentsDomain.createAttachmentModelFlow).mockReturnValue({ status: 'success', attachment: mockAttachment } as any);
    vi.mocked(attachmentsDomain.associateAttachmentToEntiChatFlow).mockReturnValue({ status: 'success' } as any);
    vi.mocked(attachmentsDomain.persistAttachmentRecordsFlow).mockReturnValue({ status: 'success' } as any);
    vi.mocked(readAttachmentPhysicalTextContent).mockResolvedValue({
      readStatus: 'success',
      attachmentId: 'att1',
      ownerType: 'enti',
      ownerId: 'e1',
      chatId: 'c1',
      scope: 'enti_chat',
      fileName: 'test.pdf',
      fileExtension: 'pdf',
      mimeType: 'application/pdf',
      contentText: 'content'
    } as any);

    const { result } = renderHook(() => useChatAttachmentDrop('enti', 'e1', 'c1'));
    await act(async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const e = { 
        preventDefault: vi.fn(), 
        stopPropagation: vi.fn(), 
        dataTransfer: { files: [file] } 
      } as unknown as React.DragEvent;
      await result.current.handlers.onDrop(e);
    });

    expect(result.current.dropState).toBe('dropped');
    expect(attachmentsDomain.createAttachmentModelFlow).toHaveBeenCalled();
    expect(attachmentsDomain.associateAttachmentToEntiChatFlow).toHaveBeenCalled();
    expect(attachmentsDomain.persistAttachmentRecordsFlow).toHaveBeenCalled();
  });
});
