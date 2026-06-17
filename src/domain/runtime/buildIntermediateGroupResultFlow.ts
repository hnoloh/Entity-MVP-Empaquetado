import type { IntermediateGroupResultRequest } from './RuntimeExecutionRequest';
import type { IntermediateGroupResult } from './RuntimeExecutionResult';

export function buildIntermediateGroupResultFlow(
  request: IntermediateGroupResultRequest
): IntermediateGroupResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Se requiere acción explícita del usuario' };
  }

  if (!request.sequenceState || request.sequenceState.status !== 'initialized') {
    return { status: 'controlled_error', error: 'No hay secuencia inicializada válida' };
  }

  if (!request.currentSlotId || request.currentSlotId !== request.sequenceState.currentSlotId) {
    return { status: 'controlled_error', error: 'currentSlotId es inválido o no coincide con la secuencia' };
  }

  if (!request.slotExecutionResult) {
    return { status: 'controlled_error', error: 'Falta el resultado de ejecución del slot' };
  }

  if (request.slotExecutionResult.status === 'blocked') {
    return { status: 'blocked', error: request.slotExecutionResult.error || 'El slot fue bloqueado' };
  }

  if (request.slotExecutionResult.status !== 'executed') {
    return { status: 'controlled_error', error: request.slotExecutionResult.error || 'El slot falló' };
  }

  return {
    status: 'success',
    groupId: request.groupId || request.sequenceState.groupId,
    chatId: request.chatId || request.sequenceState.chatId,
    slotId: request.currentSlotId,
    entiId: request.slotExecutionResult.entiId,
    executionId: request.slotExecutionResult.executionId,
    responseText: request.slotExecutionResult.responseText
  };
}
