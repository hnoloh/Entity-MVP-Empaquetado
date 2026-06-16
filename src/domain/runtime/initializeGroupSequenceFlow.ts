import { Group } from '../group/Group';
import { validateGroupCardinalityFlow } from '../group/validateGroupCardinalityFlow';
import { validateGroupGapsFlow } from '../group/validateGroupGapsFlow';
import { getGroupSequenceFlow } from '../group/getGroupSequenceFlow';
import type { ChatRepository } from '../chat/chatRepository';
import { GroupSequenceInitializationRequest } from './RuntimeExecutionRequest';
import { GroupSequenceInitializationResult } from './RuntimeExecutionResult';

export function initializeGroupSequenceFlow(
  request: GroupSequenceInitializationRequest,
  groups: Group[],
  chatRepo: ChatRepository
): GroupSequenceInitializationResult {
  if (!request.requestedByUserAction) {
    return { status: 'blocked', error: 'Se requiere acción explícita del usuario' };
  }

  if (!request.groupId || request.groupId.trim() === '') {
    return { status: 'controlled_error', error: 'Grupo no especificado' };
  }

  const group = groups.find(g => g.id === request.groupId);
  if (!group) {
    return { status: 'controlled_error', error: 'El Grupo no existe' };
  }

  if (!request.groupChatId || request.groupChatId.trim() === '') {
    return { status: 'controlled_error', error: 'Chat de Grupo no especificado' };
  }

  const chat = chatRepo.getById(request.groupChatId);
  if (!chat || chat.owner.type !== 'group' || chat.owner.id !== request.groupId) {
    return { status: 'controlled_error', error: 'Chat de Grupo ausente o inconsistente' };
  }

  const hasValidCardinality = validateGroupCardinalityFlow(groups, group.id);
  if (!hasValidCardinality) {
    return { status: 'blocked', error: 'Cardinalidad inválida' };
  }

  const gapValidation = validateGroupGapsFlow(group);
  if (!gapValidation.valid) {
    return { status: 'blocked', error: 'Huecos inválidos' };
  }

  const sequence = getGroupSequenceFlow(group);
  if (sequence.length === 0) {
    return { status: 'blocked', error: 'Slots vacíos o no ejecutables' };
  }

  const pendingSlotIds = sequence.map(s => s.slotId);
  const currentSlotId = pendingSlotIds[0];
  const sequenceId = `seq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return {
    status: 'initialized',
    groupId: group.id,
    chatId: chat.id,
    sequenceId,
    currentSlotId,
    pendingSlotIds,
    completedSlotIds: []
  };
}
