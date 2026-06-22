/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import type { Enti } from '../../enti/Enti';
import {
  persistCognitiveConfigFlow,
  restoreCognitiveConfigFlow,
  type CognitivePersistencePayload,
  type CognitivePersistenceRequest,
  type CognitiveRestoreRequest
} from '../cognitivePersistence';

describe('Cognitive Functional Persistence', () => {
  const validEnti: Enti = {
    id: 'enti-1',
    type: 'enti',
    name: 'Test Enti',
    harness: { function: '', rules: [], workMaterial: '', knowledge: '' },
    cognitiveConfig: {
      mode: 'cloud',
      provider: 'openai',
      model: 'gpt-4',
      apiKey: 'secret-key-123'
    },
    status: 'complete'
  };

  it('blocks execution without explicit user action', () => {
    const request: CognitivePersistenceRequest = { explicitUserAction: false, entis: [validEnti] };
    const result = persistCognitiveConfigFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toMatch(/Missing explicit user action/);
  });

  it('persists cognitive config successfully and strips apiKey', () => {
    const request: CognitivePersistenceRequest = { explicitUserAction: true, entis: [validEnti] };
    const result = persistCognitiveConfigFlow(request);
    
    expect(result.status).toBe('success');
    expect(result.payload?.root).toBe('cognitive');
    expect(result.payload?.data.length).toBe(1);
    
    const config = result.payload?.data[0].config;
    expect(config?.mode).toBe('cloud');
    expect(config?.provider).toBe('openai');
    expect((config as any).apiKey).toBeUndefined();  
  });

  it('restores cognitive config successfully from valid payload', () => {
    const payload: CognitivePersistencePayload = {
      root: 'cognitive',
      version: '1.0',
      data: [{ entiId: 'enti-1', config: { mode: 'cloud', provider: 'openai', model: 'gpt-4' } }]
    };

    const request: CognitiveRestoreRequest = { explicitUserAction: true, payload };
    const result = restoreCognitiveConfigFlow(request);

    expect(result.status).toBe('success');
    expect(result.configs?.length).toBe(1);
    expect(result.configs?.[0].entiId).toBe('enti-1');
    expect(result.configs?.[0].config.mode).toBe('cloud');
  });

  it('returns controlled_error on duplicate IDs in persist', () => {
    const request: CognitivePersistenceRequest = { explicitUserAction: true, entis: [validEnti, validEnti] };
    const result = persistCognitiveConfigFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Duplicate Enti id/);
  });

  it('returns controlled_error when payload root is invalid', () => {
    const request: CognitiveRestoreRequest = { explicitUserAction: true, payload: { root: 'invalid', data: [] } };
    const result = restoreCognitiveConfigFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Invalid root/);
  });

  it('returns controlled_error when payload contains secret/apiKey', () => {
    const payload: CognitivePersistencePayload = {
      root: 'cognitive',
      version: '1.0',
      data: [{ entiId: 'enti-1', config: { mode: 'cloud', apiKey: 'leaked-key' } as any }]  
    };
    const request: CognitiveRestoreRequest = { explicitUserAction: true, payload };
    const result = restoreCognitiveConfigFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Forbidden secret found/);
  });

  it('returns controlled_error when referring to unknown entiId if entisToValidateAgainst provided', () => {
    const payload: CognitivePersistencePayload = {
      root: 'cognitive',
      version: '1.0',
      data: [{ entiId: 'enti-unknown', config: { mode: 'local' } }]
    };
    const request: CognitiveRestoreRequest = { 
      explicitUserAction: true, 
      payload, 
      entisToValidateAgainst: [validEnti] 
    };
    const result = restoreCognitiveConfigFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/refers to unknown Enti id/);
  });
});
