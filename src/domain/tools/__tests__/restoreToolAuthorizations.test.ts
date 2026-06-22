import { describe, it, expect } from 'vitest';
import { restoreEntiToolAuthorizations } from '../restoreToolAuthorizations';
import type { EntiToolRegistry } from '../entiToolRegistry';

describe('restoreEntiToolAuthorizations', () => {
  const MOCK_REGISTRY: EntiToolRegistry = {
    definitions: {
      'tool-1': { id: 'tool-1', kind: 'document_read', name: 'T1', description: 'D1', riskLevel: 'low' },
      'tool-high': { id: 'tool-high', kind: 'internet', name: 'T3', description: 'D3', riskLevel: 'high' }
    },
    authorizations: []
  };

  it('restaura payload valido descartando inconsistencias', () => {
    const payload = {
      root: 'tool_authorizations',
      version: '1.0',
      data: [
        {
          entiId: 'enti-1',
          authorizedToolIds: ['tool-1', 'tool-high', 'tool-xyz']
        }
      ]
    };

    const result = restoreEntiToolAuthorizations(payload, MOCK_REGISTRY);
    expect(result.status).toBe('success');
    expect(result.authorizations).toHaveLength(1);
    expect(result.authorizations![0]).toEqual({
      entiId: 'enti-1',
      toolId: 'tool-1',
      state: 'authorized'
    });
  });

  it('rechaza payload corrupto', () => {
    const result1 = restoreEntiToolAuthorizations({ root: 'invalid' }, MOCK_REGISTRY);
    expect(result1.status).toBe('controlled_error');

    const result2 = restoreEntiToolAuthorizations({ root: 'tool_authorizations', data: {} }, MOCK_REGISTRY);
    expect(result2.status).toBe('controlled_error');
  });
});
