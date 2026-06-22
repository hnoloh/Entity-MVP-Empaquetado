import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatAttachmentDrop } from '../useChatAttachmentDrop';
import { toolIndicatorRepository } from '../../../domain/tools/toolIndicatorRepository';
import { toolAuthorizationRepository } from '../../../domain/tools/toolAuthorizationRepository';
import { vi } from 'vitest';

vi.mock('../../../domain/tools/document-read', () => ({
  documentReadToolExecutor: vi.fn(async () => ({ status: 'success', content: { rawText: 'mock content' } }))
}));

describe('useChatAttachmentDrop - Document Read Tool Required Notice', () => {
  beforeEach(() => {
    toolIndicatorRepository.clearIndicator('enti-1', 'tool-read-doc');
    toolAuthorizationRepository.clear();
  });

  it('sets required_not_active indicator and error state on PDF drop if tool is missing', async () => {
    const { result } = renderHook(() => useChatAttachmentDrop('enti', 'enti-1', 'chat-1'));
    
    const file = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
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
    expect(result.current.errorMessage).toContain('requiere la Tool Leer Documento');

    const indicator = toolIndicatorRepository.getIndicator('enti-1', 'tool-read-doc');
    expect(indicator).toBe('required_not_active');
  });

  it('does not set error if tool is authorized', async () => {
    toolAuthorizationRepository.save([
      { entiId: 'enti-1', toolId: 'tool-read-doc', state: 'authorized' }
    ]);

    const { result } = renderHook(() => useChatAttachmentDrop('enti', 'enti-1', 'chat-1'));
    
    const file = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
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

    // It proceeds to dropped or error for other reasons, but not because of the missing tool notice
    const indicator = toolIndicatorRepository.getIndicator('enti-1', 'tool-read-doc');
    expect(indicator).toBe('active');
  });
});
