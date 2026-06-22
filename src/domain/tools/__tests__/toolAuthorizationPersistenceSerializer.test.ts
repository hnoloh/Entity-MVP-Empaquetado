import { describe, it, expect } from 'vitest';
import { serializeEntiToolAuthorizations } from '../toolAuthorizationPersistenceSerializer';
import type { EntiToolAuthorization } from '../entiToolAuthorization';
import type { EntiToolRegistry } from '../entiToolRegistry';

describe('serializeEntiToolAuthorizations', () => {
  const MOCK_REGISTRY: EntiToolRegistry = {
    definitions: {
      'tool-1': { id: 'tool-1', kind: 'document_read', name: 'T1', description: 'D1', riskLevel: 'low' },
      'tool-2': { id: 'tool-2', kind: 'generate_pdf', name: 'T2', description: 'D2', riskLevel: 'medium' },
      'tool-high': { id: 'tool-high', kind: 'internet', name: 'T3', description: 'D3', riskLevel: 'high' }
    },
    authorizations: []
  };

  it('serializa multiples authorizaciones de forma aislada y determinista', () => {
    const auths: EntiToolAuthorization[] = [
      { entiId: 'enti-2', toolId: 'tool-2', state: 'authorized' },
      { entiId: 'enti-1', toolId: 'tool-1', state: 'authorized' },
      { entiId: 'enti-1', toolId: 'tool-2', state: 'authorized' }
    ];

    const result = serializeEntiToolAuthorizations(auths, MOCK_REGISTRY);
    expect(result.status).toBe('success');
    expect(result.payload?.root).toBe('tool_authorizations');
    
    // Debería estar ordenado: enti-1 luego enti-2
    expect(result.payload?.data[0].entiId).toBe('enti-1');
    expect(result.payload?.data[0].authorizedToolIds).toEqual(['tool-1', 'tool-2']);
    
    expect(result.payload?.data[1].entiId).toBe('enti-2');
    expect(result.payload?.data[1].authorizedToolIds).toEqual(['tool-2']);
  });

  it('descarta tools invalidas y bloqueadas silenciosamente', () => {
    const auths: EntiToolAuthorization[] = [
      { entiId: 'enti-1', toolId: 'tool-1', state: 'authorized' },
      { entiId: 'enti-1', toolId: 'tool-high', state: 'authorized' }, // Invalid policy
      { entiId: 'enti-1', toolId: 'tool-unknown', state: 'authorized' }, // Unknown
      { entiId: 'enti-1', toolId: 'tool-2', state: 'blocked' as const } // Not 'authorized' state
    ];

    const result = serializeEntiToolAuthorizations(auths, MOCK_REGISTRY);
    expect(result.status).toBe('success');
    expect(result.payload?.data[0].authorizedToolIds).toEqual(['tool-1']);
  });
});
