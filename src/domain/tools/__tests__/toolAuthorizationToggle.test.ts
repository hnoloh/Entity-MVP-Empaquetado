import { describe, it, expect } from 'vitest';
import { toggleToolAuthorization } from '../toolAuthorizationToggle';
import type { EntiToolRegistry } from '../entiToolRegistry';

describe('toolAuthorizationToggle', () => {
  const MOCK_REGISTRY: EntiToolRegistry = {
    definitions: {
      'tool-1': { id: 'tool-1', kind: 'document_read', name: 'T1', description: 'D1', riskLevel: 'low' },
      'tool-high': { id: 'tool-high', kind: 'internet', name: 'T2', description: 'D2', riskLevel: 'high' }
    },
    authorizations: [
      { entiId: 'enti-1', toolId: 'tool-1', state: 'authorized' },
      { entiId: 'enti-1', toolId: 'tool-high', state: 'blocked' }
    ]
  };

  it('autoriza tool válida para Enti válido', () => {
    const result = toggleToolAuthorization('enti-2', 'tool-1', MOCK_REGISTRY);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.newAuthorizations).toContainEqual({ entiId: 'enti-2', toolId: 'tool-1', state: 'authorized' });
    }
  });

  it('desautoriza tool autorizada para el mismo Enti', () => {
    const result = toggleToolAuthorization('enti-1', 'tool-1', MOCK_REGISTRY);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.newAuthorizations.find(a => a.toolId === 'tool-1' && a.entiId === 'enti-1')).toBeUndefined();
    }
  });

  it('bloquea ownerType group', () => {
    const result = toggleToolAuthorization('group', 'tool-1', MOCK_REGISTRY);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('group_owner_not_allowed');
    }
  });

  it('bloquea tool inexistente', () => {
    const result = toggleToolAuthorization('enti-1', 'tool-xxx', MOCK_REGISTRY);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('unknown_tool');
    }
  });

  it('permite riesgo alto ahora', () => {
    const result = toggleToolAuthorization('enti-2', 'tool-high', MOCK_REGISTRY);
    expect(result.success).toBe(true);
  });

  it('bloquea toggle de tool explicitamente bloqueada', () => {
    const result = toggleToolAuthorization('enti-1', 'tool-high', MOCK_REGISTRY);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('tool_not_authorized');
    }
  });
});
