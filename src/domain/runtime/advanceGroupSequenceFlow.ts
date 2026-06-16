import { GroupSequenceAdvanceRequest } from './RuntimeExecutionRequest';
import { GroupSequenceAdvanceResult } from './RuntimeExecutionResult';

export function advanceGroupSequenceFlow(
  request: GroupSequenceAdvanceRequest
): GroupSequenceAdvanceResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Se requiere acción explícita del usuario para avanzar' };
  }

  const { groupId, chatId, currentSlotId, sequenceState, sentResult } = request;

  if (!sequenceState || sequenceState.status !== 'initialized') {
    return { status: 'controlled_error', error: 'Falta estado de secuencia inicializado' };
  }

  if (!sentResult) {
    return { status: 'controlled_error', error: 'Falta resultado enviado' };
  }

  if (sentResult.status !== 'sent') {
    return { status: 'controlled_error', error: 'El resultado previo no ha sido enviado formalmente' };
  }

  if (
    sentResult.groupId !== groupId ||
    sentResult.chatId !== chatId ||
    sentResult.slotId !== currentSlotId
  ) {
    return { status: 'controlled_error', error: 'Trazabilidad inconsistente en el resultado enviado' };
  }

  if (sequenceState.currentSlotId !== currentSlotId) {
    return { status: 'controlled_error', error: 'El currentSlotId no coincide con el estado de la secuencia' };
  }

  const { pendingSlotIds, completedSlotIds } = sequenceState;
  
  if (!pendingSlotIds || pendingSlotIds.length === 0) {
    return { 
      status: 'completed', 
      groupId, 
      chatId,
      previousSlotId: currentSlotId 
    };
  }

  const currentIndex = pendingSlotIds.indexOf(currentSlotId);
  if (currentIndex === -1) {
    return { status: 'controlled_error', error: 'El slot actual no está en la lista de pendientes' };
  }

  const newCompletedSlotIds = [...(completedSlotIds || []), currentSlotId];
  
  const nextIndex = currentIndex + 1;
  const isLast = nextIndex >= pendingSlotIds.length;

  if (isLast) {
    return { 
      status: 'completed', 
      groupId, 
      chatId,
      previousSlotId: currentSlotId,
      updatedSequenceState: {
        ...sequenceState,
        currentSlotId: undefined,
        completedSlotIds: newCompletedSlotIds
      }
    };
  }

  const nextSlotId = pendingSlotIds[nextIndex];

  return {
    status: 'advanced',
    groupId,
    chatId,
    previousSlotId: currentSlotId,
    nextSlotId,
    updatedSequenceState: {
      ...sequenceState,
      currentSlotId: nextSlotId,
      completedSlotIds: newCompletedSlotIds
    }
  };
}
