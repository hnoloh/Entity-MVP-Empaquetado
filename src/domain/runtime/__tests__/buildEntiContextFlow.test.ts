import { describe, it, expect } from 'vitest';
import { buildEntiContextFlow } from '../buildEntiContextFlow';
import type { EntiContextBuildRequest } from '../RuntimeExecutionRequest';
import type { Enti } from '../../enti/Enti';
import type { Chat } from '../../chat/Chat';

describe('buildEntiContextFlow', () => {
  const validRequest: EntiContextBuildRequest = {
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

  it('Construye contexto con entiId, chatId y brainId resuelto', () => {
    const result = buildEntiContextFlow(validRequest, validEnti, validChat);
    expect(result.success).toBe(true);
    expect(result.contextId).toBeDefined();
    expect(result.entiId).toBe('enti-1');
    expect(result.chatId).toBe('chat-1');
    expect(result.activeBrain).toBeDefined();
    expect(result.activeBrain?.mode).toBe('local');
  });

  it('Solicitud sin Enti target devuelve error controlado', () => {
    const result = buildEntiContextFlow(validRequest, undefined, validChat);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Enti target not found');
  });

  it('Solicitud sin Chat target devuelve error controlado', () => {
    const result = buildEntiContextFlow(validRequest, validEnti, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Chat target not found');
  });

  it('Brain no resuelto devuelve error controlado', () => {
    const unconfiguredEnti: Enti = {
      ...validEnti,
      cognitiveConfig: { mode: 'unconfigured' }
    };
    const result = buildEntiContextFlow(validRequest, unconfiguredEnti, validChat);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Enti has no active brain configured');
  });

  it('El resultado no contiene respuesta generada ni prompt final', () => {
    const result = buildEntiContextFlow(validRequest, validEnti, validChat);
    expect('response' in result).toBe(false);
    expect('prompt' in result).toBe(false);
  });

  it('Dos invocaciones con la misma entrada retornan resultado determinista', () => {
    const r1 = buildEntiContextFlow(validRequest, validEnti, validChat);
    const r2 = buildEntiContextFlow(validRequest, validEnti, validChat);
    
    expect(r1.success).toBe(r2.success);
    expect(r1.entiId).toBe(r2.entiId);
    expect(r1.chatId).toBe(r2.chatId);
    expect(r1.activeBrain).toEqual(r2.activeBrain);
  });

  it('No muta Enti, Chat ni Request', () => {
    const clonedRequest = JSON.parse(JSON.stringify(validRequest));
    const clonedEnti = JSON.parse(JSON.stringify(validEnti));
    const clonedChat = JSON.parse(JSON.stringify(validChat));
    
    buildEntiContextFlow(validRequest, validEnti, validChat);
    
    expect(validRequest).toEqual(clonedRequest);
    expect(validEnti).toEqual(clonedEnti);
    expect(validChat).toEqual(clonedChat);
  });
});
