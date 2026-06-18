import { buildEntiToolBeltViewModel } from '../buildEntiToolBeltViewModel';
import type { EntiToolDefinition, EntiToolAuthorization } from '../../../domain/tools';

describe('buildEntiToolBeltViewModel', () => {
  const mockDefs: Record<string, EntiToolDefinition> = {
    't1': { id: 't1', kind: 'document_read', name: 'Read', description: 'Read doc', riskLevel: 'low' },
    't2': { id: 't2', kind: 'internet', name: 'Web', description: 'Web access', riskLevel: 'high' }
  };

  it('transforma ToolDefinitions en items visuales', () => {
    const vm = buildEntiToolBeltViewModel('enti-1', mockDefs, []);
    expect(vm).toHaveLength(2);
    expect(vm[0].id).toBe('t1');
    expect(vm[0].state).toBe('available');
    
    // High risk defaults to blocked
    expect(vm[1].id).toBe('t2');
    expect(vm[1].state).toBe('blocked');
    expect(vm[1].blockedReason).toBe('risk_not_authorized');
  });

  it('mapea estados de autorización', () => {
    const auths: EntiToolAuthorization[] = [
      { entiId: 'enti-1', toolId: 't1', state: 'controlled_error' },
      { entiId: 'enti-1', toolId: 't2', state: 'authorized' }
    ];
    const vm = buildEntiToolBeltViewModel('enti-1', mockDefs, auths);
    
    expect(vm.find(i => i.id === 't1')?.state).toBe('controlled_error');
    expect(vm.find(i => i.id === 't2')?.state).toBe('authorized');
  });

  it('no da tools a owners tipo group', () => {
    const vm = buildEntiToolBeltViewModel('group', mockDefs, []);
    expect(vm).toHaveLength(0);
  });
});
