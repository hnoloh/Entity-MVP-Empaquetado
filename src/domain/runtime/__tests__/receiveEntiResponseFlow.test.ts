import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { receiveEntiResponseFlow } from '../receiveEntiResponseFlow';
import type { EntiResponseReceptionRequest } from '../RuntimeExecutionRequest';
import type { Enti } from '../../enti/Enti';
import type { Chat } from '../../chat/Chat';
import { chatRepository } from '../../chat/chatRepository';

describe('receiveEntiResponseFlow (Regularized)', () => {
  const validRequest: EntiResponseReceptionRequest = {
    entiId: 'enti-1',
    chatId: 'chat-1',
    explicitUserAction: true,
    targetType: 'ENTI',
    executionId: 'exec-123',
    responseText: 'Fake response from provider'
  };

  const validEnti: Enti = {
    id: 'enti-1',
    type: 'enti',
    name: 'Test Enti',
    status: 'complete',
    harness: { function: '', rules: [], workMaterial: '', knowledge: '' },
    cognitiveConfig: { mode: 'local', provider: 'ollama', model: 'llama3' }
  };

  let testChat: Chat;

  beforeEach(() => {
    testChat = {
      id: 'chat-1',
      owner: { type: 'enti', id: 'enti-1' },
      history: []
    };
    vi.spyOn(chatRepository, 'getById').mockReturnValue(testChat);
    vi.spyOn(chatRepository, 'save').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Recibe exitosamente la respuesta y muta el Chat.history a través de RV-03', () => {
    const result = receiveEntiResponseFlow(validRequest, validEnti, testChat);
    
    expect(result.status).toBe('received');
    expect(result.executionId).toBe('exec-123');
    // Verifica que el historial ha crecido
    expect(testChat.history).toHaveLength(1);
    expect(testChat.history[0].role).toBe('assistant');
    expect(testChat.history[0].content).toBe('Fake response from provider');
  });

  it('Devuelve controlled_error si falta responseText', () => {
    const missingText = { ...validRequest, responseText: undefined };
    const result = receiveEntiResponseFlow(missingText, validEnti, testChat);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Missing responseText');
  });

  it('Bloquea la recepción si la ejecución estaba bloqueada por falta de acción explícita', () => {
    const blockedRequest = { ...validRequest, explicitUserAction: false };
    const result = receiveEntiResponseFlow(blockedRequest, validEnti, testChat);
    expect(result.status).toBe('blocked');
  });

  it('Devuelve controlled_error si falta el Enti target', () => {
    const result = receiveEntiResponseFlow(validRequest, undefined, testChat);
    expect(result.status).toBe('controlled_error');
  });

  it('Devuelve controlled_error si falta el Chat target', () => {
    const result = receiveEntiResponseFlow(validRequest, validEnti, undefined);
    expect(result.status).toBe('controlled_error');
  });
});
