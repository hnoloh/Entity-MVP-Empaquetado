import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { executeEntiFlow } from '../executeEntiFlow';
import { receiveEntiResponseFlow } from '../receiveEntiResponseFlow';
import type { EntiExecutionRequest, EntiResponseReceptionRequest } from '../RuntimeExecutionRequest';
import type { Enti } from '../../enti/Enti';
import type { Chat } from '../../chat/Chat';
import { OpenAIExecutor } from '../provider/OpenAIExecutor';
import { chatRepository } from '../../chat/chatRepository';

describe('Real Enti Execution Regularization - Integration', () => {
  const enti: Enti = {
    id: 'enti-1',
    type: 'enti',
    name: 'OpenAI Enti',
    status: 'complete',
    harness: { function: 'Helpful bot', rules: ['Be kind'], workMaterial: '', knowledge: '' },
    cognitiveConfig: { mode: 'cloud', provider: 'openai', model: 'gpt-4o', apiKey: 'fake-key' }
  };

  let chat: Chat;

  beforeEach(() => {
    chat = {
      id: 'chat-1',
      owner: { type: 'enti', id: 'enti-1' },
      history: [{ id: 'msg-1', role: 'user', content: 'Hello', timestamp: 1 }]
    };
    vi.spyOn(chatRepository, 'getById').mockReturnValue(chat);
    vi.spyOn(chatRepository, 'save').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Orquesta la cadena completa desde ejecución hasta mutación del chat', async () => {
    const provider = new OpenAIExecutor();

    // 1. Ejecución
    const execReq: EntiExecutionRequest = {
      entiId: enti.id,
      chatId: chat.id,
      explicitUserAction: true,
      targetType: 'ENTI'
    };

    const execResult = await executeEntiFlow(execReq, enti, chat, provider);
    expect(execResult.status).toBe('executed');
    expect(execResult.responseText).toContain('[OPENAI] Response to:');

    // 2. Recepción
    const recReq: EntiResponseReceptionRequest = {
      ...execReq,
      executionId: execResult.executionId,
      responseText: execResult.responseText
    };

    const recResult = receiveEntiResponseFlow(recReq, enti, chat);
    expect(recResult.status).toBe('received');
    
    // 3. Verificación de side-effect controlado (RV-03)
    expect(chat.history).toHaveLength(2);
    expect(chat.history[1].role).toBe('assistant');
    expect(chat.history[1].content).toContain('[OPENAI]');
  });
});
