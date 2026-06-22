import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useEntiToolBelt } from '../useEntiToolBelt';
import { toolAuthorizationRepository } from '../../../domain/tools/toolAuthorizationRepository';

describe('useEntiToolBelt Persistence Integration', () => {
  beforeEach(() => {
    toolAuthorizationRepository.clear();
  });

  it('lee el estado inicial persistido del repositorio', () => {
    toolAuthorizationRepository.save([
      { entiId: 'enti-test', toolId: 'tool-read-doc', state: 'authorized' }
    ]);

    const { result } = renderHook(() => useEntiToolBelt('enti-test'));
    
    const readDoc = result.current.tools.find(t => t.id === 'tool-read-doc');
    expect(readDoc?.state).toBe('authorized');
  });

  it('almacena en el repositorio al togglear tool autorizable', () => {
    const { result } = renderHook(() => useEntiToolBelt('enti-test'));
    
    act(() => {
      result.current.toggleAuthorization('tool-gen-pdf');
    });

    const persisted = toolAuthorizationRepository.list();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].entiId).toBe('enti-test');
    expect(persisted[0].toolId).toBe('tool-gen-pdf');
    expect(persisted[0].state).toBe('authorized');

    const pdfTool = result.current.tools.find(t => t.id === 'tool-gen-pdf');
    expect(pdfTool?.state).toBe('authorized');
  });

  it('desactivar elimina del repositorio persistido', () => {
    toolAuthorizationRepository.save([
      { entiId: 'enti-test', toolId: 'tool-dl', state: 'authorized' }
    ]);

    const { result } = renderHook(() => useEntiToolBelt('enti-test'));
    
    act(() => {
      result.current.toggleAuthorization('tool-dl');
    });

    expect(toolAuthorizationRepository.list()).toHaveLength(0);

    const dlTool = result.current.tools.find(t => t.id === 'tool-dl');
    expect(dlTool?.state).toBe('available');
  });

  it('no interfiere entre multiples entis simulando remounts', () => {
    const hook1 = renderHook(() => useEntiToolBelt('enti-A'));
    act(() => {
      hook1.result.current.toggleAuthorization('tool-gen-docx');
    });

    const hook2 = renderHook(() => useEntiToolBelt('enti-B'));
    
    const docxA = hook1.result.current.tools.find(t => t.id === 'tool-gen-docx');
    const docxB = hook2.result.current.tools.find(t => t.id === 'tool-gen-docx');
    
    expect(docxA?.state).toBe('authorized');
    expect(docxB?.state).toBe('available'); // enti-B no lo tiene
  });
});
