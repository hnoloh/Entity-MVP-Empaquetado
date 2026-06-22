import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntiHarnessAttachmentDrop } from '../useEntiHarnessAttachmentDrop';
import { toolIndicatorRepository } from '../../../domain/tools/toolIndicatorRepository';
import { toolAuthorizationRepository } from '../../../domain/tools/toolAuthorizationRepository';
import { vi } from 'vitest';

vi.mock('../../../domain/tools/document-read', () => ({
  documentReadToolExecutor: vi.fn(async () => ({ status: 'success', content: { rawText: 'mock content' } }))
}));

describe('useEntiHarnessAttachmentDrop - Document Read Tool Required Notice', () => {
  beforeEach(() => {
    toolIndicatorRepository.clearIndicator('enti-2', 'tool-read-doc');
    toolAuthorizationRepository.clear();
  });

  it('sets required_not_active indicator and error state on DOCX drop if tool is missing', async () => {
    const { result } = renderHook(() => useEntiHarnessAttachmentDrop('enti-2', 'enti_knowledge'));
    
    const file = new File(['dummy content'], 'document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', getAsFile: () => file }]
    };

    const dropEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      dataTransfer
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handlers.onDrop(dropEvent);
    });

    expect(result.current.dropState).toBe('error');
    expect(result.current.errorMessage).toContain('conocimiento o material de trabajo');

    const indicator = toolIndicatorRepository.getIndicator('enti-2', 'tool-read-doc');
    expect(indicator).toBe('required_not_active');
  });

  it('does not error for TXT files even if tool is missing', async () => {
    const { result } = renderHook(() => useEntiHarnessAttachmentDrop('enti-2', 'enti_knowledge'));
    
    const file = new File(['dummy text content'], 'document.txt', { type: 'text/plain' });
    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', getAsFile: () => file }]
    };

    const dropEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      dataTransfer
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handlers.onDrop(dropEvent);
    });

    const indicator = toolIndicatorRepository.getIndicator('enti-2', 'tool-read-doc');
    expect(indicator).toBeUndefined();
    // No error for tool missing
  });
});
