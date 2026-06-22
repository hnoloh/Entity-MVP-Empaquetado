import { describe, it, expect } from 'vitest';
import { validateToolAuthorizationForPersistence } from '../toolAuthorizationPersistencePolicy';
import type { EntiToolRegistry } from '../entiToolRegistry';

describe('validateToolAuthorizationForPersistence', () => {
  const MOCK_REGISTRY: EntiToolRegistry = {
    definitions: {
      'tool-1': { id: 'tool-1', kind: 'document_read', name: 'T1', description: 'D1', riskLevel: 'low' },
      'tool-high': { id: 'tool-high', kind: 'internet', name: 'T2', description: 'D2', riskLevel: 'high' }
    },
    authorizations: []
  };

  it('permite una tool valida para Enti', () => {
    const res = validateToolAuthorizationForPersistence('enti-1', 'tool-1', MOCK_REGISTRY);
    expect(res.success).toBe(true);
  });

  it('bloquea para owner group', () => {
    const res = validateToolAuthorizationForPersistence('group', 'tool-1', MOCK_REGISTRY);
    expect(res.success).toBe(false);
    expect(res.reason).toBe('group_owner_not_allowed');
  });

  it('bloquea para tool desconocida', () => {
    const res = validateToolAuthorizationForPersistence('enti-1', 'tool-xyz', MOCK_REGISTRY);
    expect(res.success).toBe(false);
    expect(res.reason).toBe('unknown_tool');
  });

  it('bloquea tool con riskLevel high o critical', () => {
    const res = validateToolAuthorizationForPersistence('enti-1', 'tool-high', MOCK_REGISTRY);
    expect(res.success).toBe(false);
    expect(res.reason).toBe('risk_not_authorized');
  });
});
