import { describe, it, expect } from 'vitest';
import {
  restoreOperationalStateFlow,
  type OperationalRestorePayload,
  type OperationalRestoreRequest
} from '../operationalRestore';

describe('Operational Restore Functional Flow', () => {
  const validEntiPayload = {
    root: 'entis',
    version: '1.0',
    data: [{ id: 'enti-1', name: 'Test', type: 'enti', status: 'complete', harness: { function: '', rules: [], workMaterial: '', knowledge: '' }, cognitiveConfig: { mode: 'cloud' } }]
  };

  const validGroupPayload = {
    root: 'groups',
    version: '1.0',
    data: [{ id: 'group-1', type: 'group', name: 'Group Test', slots: { '1': 'enti-1' } }]
  };

  const validCognitivePayload = {
    root: 'cognitive',
    version: '1.0',
    data: [{ entiId: 'enti-1', config: { mode: 'cloud', provider: 'test', model: 'test' } }]
  };

  const validChatPayload = {
    root: 'chats',
    version: '1.0',
    data: [{ id: 'chat-1', owner: { type: 'enti', id: 'enti-1' }, history: [] }]
  };

  const validSequencePayload = {
    root: 'sequences',
    version: '1.0',
    data: [{ groupId: 'group-1', sequenceId: 'seq-1', status: 'initialized' }]
  };

  const validPositionPayload = {
    root: 'member_positions',
    version: '1.0',
    data: [{ groupId: 'group-1', slots: { '1': 'enti-1' } }]
  };

  const fullPayload: OperationalRestorePayload = {
    root: 'operational_restore',
    version: '1.0',
    data: {
      entiPayload: validEntiPayload,
      groupPayload: validGroupPayload,
      cognitivePayload: validCognitivePayload,
      chatPayload: validChatPayload,
      sequencePayload: validSequencePayload,
      positionPayload: validPositionPayload
    }
  };

  it('blocks execution without explicit user action', () => {
    const request: OperationalRestoreRequest = { explicitUserAction: false, payload: fullPayload };
    const result = restoreOperationalStateFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toMatch(/Missing explicit user action/);
  });

  it('restoreOperationalStateFlow success con payload completo', () => {
    const request: OperationalRestoreRequest = { explicitUserAction: true, payload: fullPayload };
    const result = restoreOperationalStateFlow(request);
    expect(result.status).toBe('success');
    expect(result.restoredState?.entis?.length).toBe(1);
    expect(result.restoredState?.groups?.length).toBe(1);
    expect(result.restoredState?.cognitiveConfigs?.length).toBe(1);
    expect(result.restoredState?.chats?.length).toBe(1);
    expect(result.restoredState?.sequences?.length).toBe(1);
    expect(result.restoredState?.positions?.length).toBe(1);
  });

  it('controlled_error por raíz inválida', () => {
    const request: OperationalRestoreRequest = { explicitUserAction: true, payload: { root: 'invalid', data: {} } };
    const result = restoreOperationalStateFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Invalid root/);
  });

  it('controlled_error por fallos de cross-reference entre partes (estrategia all-or-nothing)', () => {
    const invalidGroupPayload = {
      root: 'groups',
      version: '1.0',
      data: [{ id: 'group-1', type: 'group', name: 'Group Test', slots: { '1': 'enti-UNKNOWN' } }]
    };

    const payload = {
      root: 'operational_restore',
      version: '1.0',
      data: {
        entiPayload: validEntiPayload,
        groupPayload: invalidGroupPayload, // Group points to unknown enti
        cognitivePayload: validCognitivePayload,
        chatPayload: validChatPayload,
        sequencePayload: validSequencePayload,
        positionPayload: validPositionPayload
      }
    };

    const request: OperationalRestoreRequest = { explicitUserAction: true, payload };
    const result = restoreOperationalStateFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Cross reference inconsistency/);
  });

  it('controlled_error si un sub-payload tiene un root invalido o esta corrupto', () => {
    const payload = {
      root: 'operational_restore',
      version: '1.0',
      data: {
        entiPayload: validEntiPayload,
        groupPayload: validGroupPayload,
        cognitivePayload: { root: 'invalid_cog' },
        chatPayload: validChatPayload,
        sequencePayload: validSequencePayload,
        positionPayload: validPositionPayload
      }
    };

    const request: OperationalRestoreRequest = { explicitUserAction: true, payload };
    const result = restoreOperationalStateFlow(request);
    expect(result.status).toBe('controlled_error');
    // It should fail in restoreCognitiveConfigFlow
    expect(result.error).toBeDefined();
  });
});
