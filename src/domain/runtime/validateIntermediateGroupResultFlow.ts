import type { IntermediateGroupValidationRequest } from './RuntimeExecutionRequest';
import type { IntermediateGroupValidationResult } from './RuntimeExecutionResult';

export function validateIntermediateGroupResultFlow(
  request: IntermediateGroupValidationRequest
): IntermediateGroupValidationResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Se requiere acción explícita del usuario para validar' };
  }

  const { intermediateResult } = request;
  if (!intermediateResult) {
    return { status: 'controlled_error', error: 'Falta el resultado intermedio' };
  }

  if (intermediateResult.status !== 'success') {
    return { status: 'controlled_error', error: 'El resultado intermedio no tuvo éxito o fue bloqueado' };
  }

  if (!intermediateResult.groupId) {
    return { status: 'controlled_error', error: 'Falta groupId en el resultado intermedio' };
  }

  if (!intermediateResult.chatId) {
    return { status: 'controlled_error', error: 'Falta chatId en el resultado intermedio' };
  }

  if (!intermediateResult.slotId) {
    return { status: 'controlled_error', error: 'Falta slotId en el resultado intermedio' };
  }

  if (!intermediateResult.entiId) {
    return { status: 'controlled_error', error: 'Falta entiId en el resultado intermedio' };
  }

  if (!intermediateResult.responseText || intermediateResult.responseText.trim() === '') {
    return { status: 'controlled_error', error: 'El resultado está vacío o carece de responseText' };
  }

  return {
    status: 'valid',
    groupId: intermediateResult.groupId,
    chatId: intermediateResult.chatId,
    slotId: intermediateResult.slotId,
    entiId: intermediateResult.entiId
  };
}
