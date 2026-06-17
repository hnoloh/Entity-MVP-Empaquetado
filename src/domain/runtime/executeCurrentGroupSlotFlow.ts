import type { Group } from '../group/Group';
import type { GroupSlotExecutionRequest } from './RuntimeExecutionRequest';
import type { GroupSlotExecutionResult } from './RuntimeExecutionResult';
import { executeEntiFlow } from './executeEntiFlow';
import { receiveEntiResponseFlow } from './receiveEntiResponseFlow';
import type { Enti } from '../enti/Enti';
import type { Chat } from '../chat/Chat';
import type { ProviderBridge } from './provider/ProviderBridge';

export async function executeCurrentGroupSlotFlow(
  request: GroupSlotExecutionRequest,
  groups: Group[],
  entis: Enti[],
  groupChat: Chat | undefined | null,
  provider?: ProviderBridge
): Promise<GroupSlotExecutionResult> {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Se requiere acción explícita del usuario' };
  }

  const state = request.sequenceState;
  if (!state || state.status !== 'initialized') {
    return { status: 'controlled_error', error: 'No hay secuencia inicializada válida' };
  }

  if (!request.groupId || request.groupId !== state.groupId) {
    return { status: 'controlled_error', error: 'El Grupo proporcionado no coincide con la secuencia' };
  }

  if (!request.currentSlotId) {
    return { status: 'controlled_error', error: 'No se especificó currentSlotId' };
  }

  if (request.currentSlotId !== state.currentSlotId) {
    return { status: 'controlled_error', error: 'currentSlotId no coincide con la secuencia actual' };
  }

  const validSlots = ['1', '2', '3', '4', '5'];
  if (!validSlots.includes(request.currentSlotId)) {
    return { status: 'controlled_error', error: 'currentSlotId fuera de rango' };
  }

  const group = groups.find(g => g.id === request.groupId);
  if (!group) {
    return { status: 'controlled_error', error: 'El Grupo no existe' };
  }

  if (!groupChat) {
    return { status: 'controlled_error', error: 'No se encontró el Chat de Grupo' };
  }

  const entiId = group.slots?.[request.currentSlotId as keyof typeof group.slots];
  if (!entiId || typeof entiId !== 'string' || entiId.trim() === '') {
    return { status: 'controlled_error', error: 'El slot no contiene un Enti asignado' };
  }

  const targetEnti = entis.find(e => e.id === entiId);
  if (!targetEnti) {
    return { status: 'controlled_error', error: 'El Enti asignado no existe' };
  }

  const entiExecutionResult = await executeEntiFlow(
    {
      entiId: targetEnti.id,
      chatId: groupChat.id,
      explicitUserAction: request.explicitUserAction,
      targetType: 'ENTI'
    },
    targetEnti,
    groupChat,
    provider
  );

  if (entiExecutionResult.status === 'blocked') {
    return { status: 'blocked', error: entiExecutionResult.error };
  }

  if (entiExecutionResult.status !== 'executed') {
    return { status: 'controlled_error', error: entiExecutionResult.error };
  }

  if (entiExecutionResult.responseText && entiExecutionResult.executionId) {
    receiveEntiResponseFlow({
      entiId: targetEnti.id,
      chatId: groupChat.id,
      explicitUserAction: request.explicitUserAction,
      targetType: 'ENTI',
      executionId: entiExecutionResult.executionId,
      responseText: entiExecutionResult.responseText
    }, targetEnti, groupChat);
  }

  return {
    status: 'executed',
    groupId: group.id,
    slotId: request.currentSlotId,
    entiId: targetEnti.id,
    chatId: groupChat.id,
    executionId: entiExecutionResult.executionId,
    responseText: entiExecutionResult.responseText
  };
}
