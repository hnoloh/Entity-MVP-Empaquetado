import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntiHarnessAttachmentDrop } from '../useEntiHarnessAttachmentDrop';
import { attachmentContentRepository } from '../../../domain/attachments/attachmentContentRepository';

describe('useEntiHarnessAttachmentDropPhysicalRead', () => {
  beforeEach(() => {
    attachmentContentRepository.clear();
    vi.useFakeTimers();
  });

  it('reads knowledge file and upserts to repository without chatId', async () => {
    const { result } = renderHook(() => useEntiHarnessAttachmentDrop('enti-1', 'enti_knowledge'));

    const file = new File(['Knowledge text'], 'know.md', { type: 'text/markdown' });
    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', getAsFile: () => file }]
    } as unknown as DataTransfer;

    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handlers.onDrop(event);
    });

    // We don't have the exact attachmentId returned easily without mocking or searching repo
    const snapshot = attachmentContentRepository.snapshot();
    expect(snapshot.entries.length).toBe(1);
    const entry = snapshot.entries[0];
    expect(entry.ownerType).toBe('enti');
    expect(entry.ownerId).toBe('enti-1');
    expect(entry.scope).toBe('enti_knowledge');
    expect(entry.chatId).toBeUndefined(); // Important: no chatId for knowledge
    expect(entry.contentText).toBe('Knowledge text');
  });

  it('reads work material file and upserts to repository without chatId', async () => {
    const { result } = renderHook(() => useEntiHarnessAttachmentDrop('enti-1', 'enti_work_material'));

    const file = new File(['Work text'], 'work.txt', { type: 'text/plain' });
    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', getAsFile: () => file }]
    } as unknown as DataTransfer;

    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handlers.onDrop(event);
    });

    const snapshot = attachmentContentRepository.snapshot();
    expect(snapshot.entries.length).toBe(1);
    expect(snapshot.entries[0].scope).toBe('enti_work_material');
    expect(snapshot.entries[0].contentText).toBe('Work text');
  });

  it('blocks invalid file type', async () => {
    const { result } = renderHook(() => useEntiHarnessAttachmentDrop('enti-1', 'enti_knowledge'));

    const file = new File(['bin'], 'doc.pdf', { type: 'application/pdf' });
    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', getAsFile: () => file }]
    } as unknown as DataTransfer;

    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handlers.onDrop(event);
    });

    expect(result.current.errorMessage).toContain('activar la Tool');
    const snapshot = attachmentContentRepository.snapshot();
    expect(snapshot.entries.length).toBe(0);
  });
});
