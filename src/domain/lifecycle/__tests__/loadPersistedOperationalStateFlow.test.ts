/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LoadPersistedOperationalStateRequest } from '../loadPersistedOperationalStateFlow';
import { loadPersistedOperationalStateFlow } from '../loadPersistedOperationalStateFlow';
import { storage } from '../../../infrastructure/storage/indexedDbStorage';
import { entiRepository } from '../../enti/entiRepository';
import { chatRepository } from '../../chat/chatRepository';

vi.mock('../../../infrastructure/storage/indexedDbStorage', () => ({
  storage: {
    loadSnapshot: vi.fn(),
    saveSnapshot: vi.fn()
  }
}));

describe('loadPersistedOperationalStateFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entiRepository.clear();
    chatRepository.clear();
  });

  it('TEST-LIFECYCLE-LOAD-01: Devuelve blocked si falta autorización de ciclo de vida', async () => {
    const request: LoadPersistedOperationalStateRequest = { lifecyclePhaseAuthorized: false };
    const result = await loadPersistedOperationalStateFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toContain('Lifecycle phase not authorized');
  });

  it('TEST-LIFECYCLE-LOAD-02: Devuelve success_empty si no hay payload persistido', async () => {
    vi.mocked(storage.loadSnapshot).mockResolvedValueOnce(null);
    const request: LoadPersistedOperationalStateRequest = { lifecyclePhaseAuthorized: true };
    const result = await loadPersistedOperationalStateFlow(request);
    expect(result.status).toBe('success_empty');
  });

  it('TEST-LIFECYCLE-LOAD-03: Devuelve controlled_error si storage falla', async () => {
    vi.mocked(storage.loadSnapshot).mockRejectedValueOnce(new Error('DB Error'));
    const request: LoadPersistedOperationalStateRequest = { lifecyclePhaseAuthorized: true };
    const result = await loadPersistedOperationalStateFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toBe('DB Error');
  });

  it('TEST-LIFECYCLE-LOAD-04: Carga payload completo y restaura en repositorios sin fallar', async () => {
    const validPayload = {
      root: 'operational_restore',
      version: '1.0',
      data: {
        entiPayload: {
          root: 'entis',
          version: '1.0',
          data: [
            { id: 'enti-1', name: 'Enti 1', type: 'enti', status: 'incomplete', harness: { function: '', rules: [], workMaterial: '', knowledge: '' }, cognitiveConfig: { mode: 'unconfigured' } }
          ]
        },
        groupPayload: { root: 'groups', version: '1.0', data: [] },
        cognitivePayload: { root: 'cognitive', version: '1.0', data: [] },
        chatPayload: { root: 'chats', version: '1.0', data: [] },
        sequencePayload: { root: 'sequences', version: '1.0', data: [] },
        positionPayload: { root: 'member_positions', version: '1.0', data: [] }
      }
    };
    vi.mocked(storage.loadSnapshot).mockResolvedValueOnce(validPayload as any);

    const request: LoadPersistedOperationalStateRequest = { lifecyclePhaseAuthorized: true };
    const result = await loadPersistedOperationalStateFlow(request);

    expect(result.status).toBe('success');
    expect(result.restoredEntis).toHaveLength(1);
    expect(entiRepository.list()).toHaveLength(1);
  });

  it('TEST-LIFECYCLE-LOAD-05: Falla controladamente con payload corrupto y no muta repositorios', async () => {
    const invalidPayload = {
      root: 'operational_restore',
      version: '1.0',
      data: {
        entiPayload: { entis: [{ id: 123, type: 'invalid' }] } // invalid types
      }
    };
    vi.mocked(storage.loadSnapshot).mockResolvedValueOnce(invalidPayload as any);

    const request: LoadPersistedOperationalStateRequest = { lifecyclePhaseAuthorized: true };
    const result = await loadPersistedOperationalStateFlow(request);

    expect(result.status).toBe('controlled_error');
    expect(entiRepository.list()).toHaveLength(0); // All or nothing
  });

});
