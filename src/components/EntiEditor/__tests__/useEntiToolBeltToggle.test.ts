import { renderHook, act } from '@testing-library/react';
import { useEntiToolBelt } from '../useEntiToolBelt';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MOCK_REGISTRY_BASE } from '../../../domain/tools/mockRegistry';

describe('useEntiToolBelt Toggle', () => {
  beforeEach(() => {
    MOCK_REGISTRY_BASE.definitions['tool-internet'] = { id: 'tool-internet', kind: 'internet', name: 'Internet', description: 'Acceso a la web', riskLevel: 'critical' };
  });

  afterEach(() => {
    delete MOCK_REGISTRY_BASE.definitions['tool-internet'];
  });
  it('toggles a tool from available to authorized and isolates by entiId', () => {
    const { result: r1 } = renderHook(() => useEntiToolBelt('enti-1'));
    
    // Initially tool-read-doc is available
    const docTool = r1.current.tools.find(t => t.id === 'tool-read-doc');
    expect(docTool?.state).toBe('available');
    
    // Toggle on enti-1
    act(() => {
      r1.current.toggleAuthorization('tool-read-doc');
    });
    
    const docToolAfter = r1.current.tools.find(t => t.id === 'tool-read-doc');
    expect(docToolAfter?.state).toBe('authorized');
    
    // Verify isolation on enti-2
    const { result: r2 } = renderHook(() => useEntiToolBelt('enti-2'));
    const docToolEnti2 = r2.current.tools.find(t => t.id === 'tool-read-doc');
    expect(docToolEnti2?.state).toBe('available'); // should not be authorized for enti-2
    
    // Untoggle on enti-1
    act(() => {
      r1.current.toggleAuthorization('tool-read-doc');
    });
    
    expect(r1.current.tools.find(t => t.id === 'tool-read-doc')?.state).toBe('available');
  });

  it('fails to authorize a blocked high risk tool', () => {
    const { result } = renderHook(() => useEntiToolBelt('enti-1'));
    
    const netTool = result.current.tools.find(t => t.id === 'tool-internet');
    expect(netTool?.state).toBe('blocked');
    
    act(() => {
      const res = result.current.toggleAuthorization('tool-internet');
      expect(res.success).toBe(false);
    });
    
    // Still blocked
    const netToolAfter = result.current.tools.find(t => t.id === 'tool-internet');
    expect(netToolAfter?.state).toBe('blocked');
  });
});
