import type { EntiResponseReceptionRequest } from './RuntimeExecutionRequest';
import type { EntiResponseReceptionResult } from './RuntimeExecutionResult';
import type { Enti } from '../enti/Enti';
import type { Chat } from '../chat/Chat';
import { receiveResponseToChatFlow } from '../chat/receiveResponseToChatFlow';

export function receiveEntiResponseFlow(
  request: EntiResponseReceptionRequest,
  targetEnti: Enti | undefined | null,
  targetChat: Chat | undefined | null
): EntiResponseReceptionResult {
  
  if (!request.executionId) {
    return { status: 'controlled_error', error: 'Missing prior executionId in reception request' };
  }
  
  if (!request.responseText) {
    return { status: 'controlled_error', error: 'Missing responseText in reception request' };
  }

  if (!targetEnti) {
    return { status: 'controlled_error', error: 'Enti target not found' };
  }
  
  if (!targetChat) {
    return { status: 'controlled_error', error: 'Chat target not found' };
  }

  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Execution was blocked due to lack of explicit user action' };
  }

  // Entrega real de la respuesta al chat a través del contrato establecido en RV-03
  receiveResponseToChatFlow(targetChat.id, request.responseText);

  return {
    status: 'received',
    executionId: request.executionId,
    entiId: request.entiId,
    chatId: request.chatId,
    brainId: targetEnti.cognitiveConfig?.mode,
    contextId: `ctx-${request.executionId}` // Simulado/Trazabilidad
  };
}
