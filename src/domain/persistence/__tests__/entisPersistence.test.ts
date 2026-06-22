/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import type { Enti } from '../../enti/Enti';
import {
  buildEntisPersistencePayload,
  restoreEntisFromPersistencePayload,
  type EntiPersistencePayload
} from '../entisPersistence';

describe('Entis Functional Persistence', () => {
  const validEnti: Enti = {
    id: 'enti-1',
    type: 'enti',
    name: 'Test Enti',
    harness: {
      function: 'Test Function',
      rules: ['rule 1'],
      workMaterial: '',
      knowledge: ''
    },
    cognitiveConfig: {
      mode: 'unconfigured'
    },
    status: 'complete'
  };

  it('builds payload successfully from valid array', () => {
    const result = buildEntisPersistencePayload([validEnti]);
    expect(result.status).toBe('success');
    expect(result.payload?.root).toBe('entis');
    expect(result.payload?.data.length).toBe(1);
    expect(result.payload?.data[0].id).toBe('enti-1');
  });

  it('restores entis successfully from valid payload', () => {
    const payload: EntiPersistencePayload = {
      root: 'entis',
      version: '1.0',
      data: [validEnti]
    };
    const result = restoreEntisFromPersistencePayload(payload);
    expect(result.status).toBe('success');
    expect(result.entis?.length).toBe(1);
    expect(result.entis?.[0].id).toBe('enti-1');
  });

  it('handles empty array successfully (round-trip)', () => {
    const buildResult = buildEntisPersistencePayload([]);
    expect(buildResult.status).toBe('success');
    
    const restoreResult = restoreEntisFromPersistencePayload(buildResult.payload);
    expect(restoreResult.status).toBe('success');
    expect(restoreResult.entis?.length).toBe(0);
  });

  it('returns controlled_error when payload is not an object', () => {
    const result = restoreEntisFromPersistencePayload(null);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Payload must be an object/);
  });

  it('returns controlled_error when root is not entis', () => {
    const result = restoreEntisFromPersistencePayload({ root: 'groups', data: [] });
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Invalid root/);
  });

  it('returns controlled_error on duplicate IDs', () => {
    const payload: EntiPersistencePayload = {
      root: 'entis',
      version: '1.0',
      data: [validEnti, validEnti] // Same ID
    };
    const result = restoreEntisFromPersistencePayload(payload);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Duplicate Enti id/);
  });

  it('returns controlled_error when forbidden fields are present', () => {
    const payload: EntiPersistencePayload = {
      root: 'entis',
      version: '1.0',
      data: [{ ...validEnti, unexpectedField: 'bad', chatHistory: [] } as any]  
    };
    const result = restoreEntisFromPersistencePayload(payload);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Forbidden fields found/);
  });

  it('returns controlled_error if Enti is missing required fields', () => {
    const invalidEnti = { ...validEnti, harness: undefined };
    const payload: EntiPersistencePayload = {
      root: 'entis',
      version: '1.0',
      data: [invalidEnti as any]  
    };
    const result = restoreEntisFromPersistencePayload(payload);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/harness is missing/);
  });
});
