import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatAttachmentDrop } from '../useChatAttachmentDrop';
import * as attachmentsDomain from '../../../domain/attachments';

vi.mock('../../../domain/attachments', () => ({
  createAttachmentModelFlow: vi.fn(),
  associateAttachmentToEntiChatFlow: vi.fn(),
  associateAttachmentToGroupChatFlow: vi.fn(),
  persistAttachmentRecordsFlow: vi.fn()
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

  it('processes drop and calls domain flows', () => {
    const mockAttachment = { attachmentId: 'att1' };
    vi.mocked(attachmentsDomain.createAttachmentModelFlow).mockReturnValue({ status: 'success', attachment: mockAttachment } as any);
    vi.mocked(attachmentsDomain.associateAttachmentToEntiChatFlow).mockReturnValue({ status: 'success' } as any);
    vi.mocked(attachmentsDomain.persistAttachmentRecordsFlow).mockReturnValue({ status: 'success' } as any);

    const { result } = renderHook(() => useChatAttachmentDrop('enti', 'e1', 'c1'));
    act(() => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const e = { 
        preventDefault: vi.fn(), 
        stopPropagation: vi.fn(), 
        dataTransfer: { files: [file] } 
      } as unknown as React.DragEvent;
      result.current.handlers.onDrop(e);
    });

    expect(result.current.dropState).toBe('dropped');
    expect(attachmentsDomain.createAttachmentModelFlow).toHaveBeenCalled();
    expect(attachmentsDomain.associateAttachmentToEntiChatFlow).toHaveBeenCalled();
    expect(attachmentsDomain.persistAttachmentRecordsFlow).toHaveBeenCalled();
  });
});
