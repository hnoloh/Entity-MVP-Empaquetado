import { FinalGroupResultRequest } from './RuntimeExecutionRequest';
import { FinalGroupResult } from './RuntimeExecutionResult';

export function buildFinalGroupResultFlow(
  request: FinalGroupResultRequest
): FinalGroupResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Se requiere acción explícita del usuario para finalizar' };
  }

  const { groupId, chatId, advanceResult, sentResults } = request;

  if (!advanceResult) {
    return { status: 'controlled_error', error: 'Falta resultado de avance' };
  }

  if (advanceResult.status !== 'completed') {
    return { status: 'controlled_error', error: 'La secuencia no está en estado completed' };
  }

  if (!sentResults || sentResults.length === 0) {
    return { status: 'controlled_error', error: 'Faltan resultados enviados' };
  }

  if (advanceResult.groupId !== groupId || advanceResult.chatId !== chatId) {
    return { status: 'controlled_error', error: 'Trazabilidad inconsistente en el resultado de avance' };
  }

  for (const result of sentResults) {
    if (!result.groupId || result.groupId !== groupId) {
      return { status: 'controlled_error', error: 'Trazabilidad inconsistente de groupId en los resultados enviados' };
    }
    if (!result.chatId || result.chatId !== chatId) {
      return { status: 'controlled_error', error: 'Trazabilidad inconsistente de chatId en los resultados enviados' };
    }
    if (!result.slotId || !result.entiId) {
      return { status: 'controlled_error', error: 'Falta trazabilidad de slotId o entiId en los resultados enviados' };
    }
    if (result.status !== 'sent') {
      return { status: 'controlled_error', error: 'Hay resultados que no tienen el estado sent' };
    }
  }

  return {
    status: 'finalized',
    groupId,
    chatId,
    results: sentResults
  };
}
