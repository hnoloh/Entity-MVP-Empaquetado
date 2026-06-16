import { describe, it, expect } from 'vitest';
import { resolveActiveBrainFlow } from '../resolveActiveBrainFlow';
import type { ActiveBrainResolutionRequest } from '../RuntimeExecutionRequest';
import type { Enti } from '../../enti/Enti';
import type { Chat } from '../../chat/Chat';

describe('resolveActiveBrainFlow', () => {
  const validRequest: ActiveBrainResolutionRequest = {
    entiId: 'enti-1',
    chatId: 'chat-1',
    explicitUserAction: true,
    targetType: 'ENTI'
  };

  const validChat: Chat = {
    id: 'chat-1',
    owner: { type: 'enti', id: 'enti-1' },
    history: []
  };

  const validEnti: Enti = {
    id: 'enti-1',
    type: 'enti',
    name: 'Test Enti',
    status: 'complete',
    harness: { function: '', rules: [], workMaterial: '', knowledge: '' },
    cognitiveConfig: { mode: 'local', provider: 'ollama', model: 'llama3' }
  };

  it('Resuelve Brain activo para Enti válido con Chat target válido', () => {
    const result = resolveActiveBrainFlow(validRequest, validEnti, validChat);
    expect(result.success).toBe(true);
    expect(result.brainResolved).toBe(true);
    expect(result.activeBrain).toBeDefined();
    expect(result.activeBrain?.mode).toBe('local');
    expect(result.activeBrain?.model).toBe('llama3');
  });

  it('Falla de forma estructurada para Enti inexistente', () => {
    const result = resolveActiveBrainFlow(validRequest, undefined, validChat);
    expect(result.success).toBe(false);
    expect(result.brainResolved).toBe(false);
    expect(result.error).toContain('Enti target not found');
  });

  it('Falla de forma estructurada para Chat target inexistente', () => {
    const result = resolveActiveBrainFlow(validRequest, validEnti, undefined);
    expect(result.success).toBe(false);
    expect(result.brainResolved).toBe(false);
    expect(result.error).toContain('Chat target not found');
  });

  it('Falla de forma estructurada para Enti sin Brain activo (unconfigured)', () => {
    const unconfiguredEnti: Enti = {
      ...validEnti,
      cognitiveConfig: { mode: 'unconfigured' }
    };
    const result = resolveActiveBrainFlow(validRequest, unconfiguredEnti, validChat);
    expect(result.success).toBe(false);
    expect(result.brainResolved).toBe(false);
    expect(result.error).toContain('Enti has no active brain configured');
  });

  it('Falla de forma estructurada para local brain sin provider o model', () => {
    const incompleteLocalEnti: Enti = {
        ...validEnti,
        cognitiveConfig: { mode: 'local', provider: 'ollama', model: '' }
    };
    const result = resolveActiveBrainFlow(validRequest, incompleteLocalEnti, validChat);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Local brain is missing provider or model');
  });

  it('Falla de forma estructurada para cloud brain sin API key', () => {
    const incompleteCloudEnti: Enti = {
        ...validEnti,
        cognitiveConfig: { mode: 'cloud' }
    };
    const result = resolveActiveBrainFlow(validRequest, incompleteCloudEnti, validChat);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cloud brain is missing API key');
  });

  it('Rechaza target Grupo o secuencia (a través de la validación base)', () => {
    const groupRequest = {
      ...validRequest,
      targetType: 'GRUPO'
    } as unknown as import('../RuntimeExecutionRequest').RuntimeExecutionRequest;
    const result = resolveActiveBrainFlow(groupRequest, validEnti, validChat);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Target type must be ENTI');
  });

  it('La resolución no muta el objeto Enti ni el Chat', () => {
    const clonedEnti = JSON.parse(JSON.stringify(validEnti));
    const clonedChat = JSON.parse(JSON.stringify(validChat));
    
    resolveActiveBrainFlow(validRequest, validEnti, validChat);
    
    expect(validEnti).toEqual(clonedEnti);
    expect(validChat).toEqual(clonedChat);
  });
});
