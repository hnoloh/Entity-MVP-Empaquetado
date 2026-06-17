import { describe, it, expect } from 'vitest';
import type { Enti } from '../../enti/Enti';
import type { Group } from '../../group/Group';
import { runPersistenceHarnessFlow, type PersistenceHarnessRequest } from '../persistenceHarness';

describe('Persistence Harness Functional Flow', () => {
  const validEnti: Enti = {
    id: 'enti-1',
    type: 'enti',
    name: 'Test Enti',
    harness: {
      function: 'Test',
      rules: [],
      workMaterial: '',
      knowledge: ''
    },
    cognitiveConfig: { mode: 'unconfigured' },
    status: 'complete'
  };

  const validGroup: Group = {
    id: 'group-1',
    type: 'group',
    name: 'Test Group',
    slots: { '1': 'enti-1' }
  };

  const validEntiPayload = {
    root: 'entis',
    version: '1.0',
    data: [validEnti]
  };

  const validGroupPayload = {
    root: 'groups',
    version: '1.0',
    data: [validGroup]
  };

  it('blocks execution without explicit user action', () => {
    const request: PersistenceHarnessRequest = {
      explicitUserAction: false,
      action: 'persist',
      mode: 'entis',
      entis: [validEnti]
    };
    const result = runPersistenceHarnessFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toMatch(/Missing explicit user action/);
  });

  it('persists Entis successfully', () => {
    const request: PersistenceHarnessRequest = {
      explicitUserAction: true,
      action: 'persist',
      mode: 'entis',
      entis: [validEnti]
    };
    const result = runPersistenceHarnessFlow(request);
    expect(result.status).toBe('success');
    expect(result.entiPayload).toBeDefined();
    expect(result.entiPayload?.root).toBe('entis');
  });

  it('restores Entis successfully', () => {
    const request: PersistenceHarnessRequest = {
      explicitUserAction: true,
      action: 'restore',
      mode: 'entis',
      entiPayload: validEntiPayload
    };
    const result = runPersistenceHarnessFlow(request);
    expect(result.status).toBe('success');
    expect(result.entis?.length).toBe(1);
  });

  it('persists Groups successfully', () => {
    const request: PersistenceHarnessRequest = {
      explicitUserAction: true,
      action: 'persist',
      mode: 'groups',
      groups: [validGroup]
    };
    const result = runPersistenceHarnessFlow(request);
    expect(result.status).toBe('success');
    expect(result.groupPayload).toBeDefined();
    expect(result.groupPayload?.root).toBe('groups');
  });

  it('restores Groups successfully', () => {
    const request: PersistenceHarnessRequest = {
      explicitUserAction: true,
      action: 'restore',
      mode: 'groups',
      groupPayload: validGroupPayload
    };
    const result = runPersistenceHarnessFlow(request);
    expect(result.status).toBe('success');
    expect(result.groups?.length).toBe(1);
  });

  it('persists Combined mode successfully', () => {
    const request: PersistenceHarnessRequest = {
      explicitUserAction: true,
      action: 'persist',
      mode: 'combined',
      entis: [validEnti],
      groups: [validGroup],
      enforceCrossReferenceConsistency: true
    };
    const result = runPersistenceHarnessFlow(request);
    expect(result.status).toBe('success');
    expect(result.entiPayload).toBeDefined();
    expect(result.groupPayload).toBeDefined();
  });

  it('restores Combined mode successfully', () => {
    const request: PersistenceHarnessRequest = {
      explicitUserAction: true,
      action: 'restore',
      mode: 'combined',
      entiPayload: validEntiPayload,
      groupPayload: validGroupPayload,
      enforceCrossReferenceConsistency: true
    };
    const result = runPersistenceHarnessFlow(request);
    expect(result.status).toBe('success');
    expect(result.entis?.length).toBe(1);
    expect(result.groups?.length).toBe(1);
  });

  it('returns controlled_error on cross reference inconsistency in combined mode (persist)', () => {
    const invalidGroup = { ...validGroup, slots: { '1': 'unknown-enti' } };
    const request: PersistenceHarnessRequest = {
      explicitUserAction: true,
      action: 'persist',
      mode: 'combined',
      entis: [validEnti],
      groups: [invalidGroup],
      enforceCrossReferenceConsistency: true
    };
    const result = runPersistenceHarnessFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Cross reference inconsistency/);
  });

  it('returns controlled_error on cross reference inconsistency in combined mode (restore)', () => {
    const invalidGroupPayload = {
      root: 'groups',
      version: '1.0',
      data: [{ ...validGroup, slots: { '1': 'unknown-enti' } }]
    };
    const request: PersistenceHarnessRequest = {
      explicitUserAction: true,
      action: 'restore',
      mode: 'combined',
      entiPayload: validEntiPayload,
      groupPayload: invalidGroupPayload,
      enforceCrossReferenceConsistency: true
    };
    const result = runPersistenceHarnessFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Cross reference inconsistency during restore/);
  });

  it('returns controlled_error when payload is missing for combined restore', () => {
    const request: PersistenceHarnessRequest = {
      explicitUserAction: true,
      action: 'restore',
      mode: 'combined',
      entiPayload: validEntiPayload
      // missing groupPayload
    };
    const result = runPersistenceHarnessFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Missing groupPayload/);
  });

  it('returns controlled_error when root is invalid in inner payloads', () => {
    const request: PersistenceHarnessRequest = {
      explicitUserAction: true,
      action: 'restore',
      mode: 'entis',
      entiPayload: { root: 'invalid', data: [] }
    };
    const result = runPersistenceHarnessFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Invalid root/);
  });
});
