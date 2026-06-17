import { describe, it, expect } from 'vitest';
import { executeEntiFlow } from '../executeEntiFlow';
import type { EntiExecutionRequest } from '../RuntimeExecutionRequest';
import type { Enti } from '../../enti/Enti';
import type { Chat } from '../../chat/Chat';
import { LocalExecutor } from '../provider/LocalExecutor';

describe('executeEntiFlow (Regularized)', () => {
  const validRequest: EntiExecutionRequest = {
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

  const fakeProvider = new LocalExecutor('llama3');

  it('Ejecuta exitosamente devolviendo responseText con provider inyectado', async () => {
    const result = await executeEntiFlow(validRequest, validEnti, validChat, fakeProvider);
    expect(result.status).toBe('executed');
    expect(result.executionId).toBeDefined();
    expect(result.responseText).toContain('[LOCAL] Response to:');
  });

  it('Bloquea la ejecución si no hay acción explícita del usuario', async () => {
    const autoRequest = { ...validRequest, explicitUserAction: false };
    const result = await executeEntiFlow(autoRequest, validEnti, validChat, fakeProvider);
    expect(result.status).toBe('blocked');
  });

  it('Enti target faltante produce error controlado', async () => {
    const result = await executeEntiFlow(validRequest, undefined, validChat, fakeProvider);
    expect(result.status).toBe('controlled_error');
  });

  it('Chat target faltante produce error controlado', async () => {
    const result = await executeEntiFlow(validRequest, validEnti, undefined, fakeProvider);
    expect(result.status).toBe('controlled_error');
  });

  it('Devuelve controlled_error si falta el provider autorizado', async () => {
    const result = await executeEntiFlow(validRequest, validEnti, validChat, undefined);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Provider not authorized');
  });
});
