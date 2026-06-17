import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntiHarnessAttachmentDrop } from '../useEntiHarnessAttachmentDrop';

// Mock dependencies
vi.mock('../../../domain/attachments/createAttachmentModelFlow', () => ({
  createAttachmentModelFlow: vi.fn().mockReturnValue({ status: 'success', attachment: { attachmentId: 'test', ownerType: 'enti', ownerId: 'enti-1' } })
}));
vi.mock('../../../domain/attachments/associateAttachmentToEntiKnowledgeFlow', () => ({
  associateAttachmentToEntiKnowledgeFlow: vi.fn().mockReturnValue({ status: 'success' })
}));
vi.mock('../../../domain/attachments/associateAttachmentToEntiWorkMaterialFlow', () => ({
  associateAttachmentToEntiWorkMaterialFlow: vi.fn().mockReturnValue({ status: 'success' })
}));

describe('useEntiHarnessAttachmentDrop', () => {
  const createDragEvent = (kind: string) => {
    return {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        items: [{ kind, getAsFile: () => new File([''], 'test.txt') }]
      }
    } as any;
  };

  it('transiciona idle -> dragging_valid -> dropped', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useEntiHarnessAttachmentDrop('enti-1', 'enti_knowledge'));
    expect(result.current.dropState).toBe('idle');

    act(() => {
      result.current.handlers.onDragEnter(createDragEvent('file'));
    });
    expect(result.current.dropState).toBe('dragging_valid');

    await act(async () => {
      await result.current.handlers.onDrop(createDragEvent('file'));
    });
    expect(result.current.dropState).toBe('dropped');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.dropState).toBe('idle');
    vi.useRealTimers();
  });

  it('transiciona a dragging_blocked ante contenido invalido', () => {
    const { result } = renderHook(() => useEntiHarnessAttachmentDrop('enti-1', 'enti_knowledge'));
    act(() => {
      result.current.handlers.onDragEnter(createDragEvent('string'));
    });
    expect(result.current.dropState).toBe('dragging_blocked');
  });
});
