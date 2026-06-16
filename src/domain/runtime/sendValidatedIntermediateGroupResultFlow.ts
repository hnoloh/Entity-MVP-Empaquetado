import { ValidatedIntermediateGroupResultSendRequest } from './RuntimeExecutionRequest';
import { ValidatedIntermediateGroupResultSendResult } from './RuntimeExecutionResult';

export function sendValidatedIntermediateGroupResultFlow(
  request: ValidatedIntermediateGroupResultSendRequest
): ValidatedIntermediateGroupResultSendResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Se requiere acción explícita del usuario para enviar' };
  }

  const { intermediateResult, validationResult } = request;

  if (!intermediateResult) {
    return { status: 'controlled_error', error: 'Falta el resultado intermedio' };
  }

  if (!validationResult) {
    return { status: 'controlled_error', error: 'Falta el resultado de validación' };
  }

  if (validationResult.status !== 'valid') {
    return { status: 'blocked', error: 'El resultado no es válido o está bloqueado' };
  }

  if (
    intermediateResult.groupId !== validationResult.groupId ||
    intermediateResult.chatId !== validationResult.chatId ||
    intermediateResult.slotId !== validationResult.slotId ||
    intermediateResult.entiId !== validationResult.entiId
  ) {
    return { status: 'controlled_error', error: 'Trazabilidad inconsistente entre validación y resultado' };
  }

  if (!intermediateResult.groupId || !intermediateResult.chatId || !intermediateResult.slotId || !intermediateResult.entiId) {
    return { status: 'controlled_error', error: 'Falta trazabilidad mínima en el resultado' };
  }

  return {
    status: 'sent',
    groupId: intermediateResult.groupId,
    chatId: intermediateResult.chatId,
    slotId: intermediateResult.slotId,
    entiId: intermediateResult.entiId,
    responseText: intermediateResult.responseText
  };
}
