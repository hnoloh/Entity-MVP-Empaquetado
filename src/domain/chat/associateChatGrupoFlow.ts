import type { Chat } from './Chat';
import { chatRepository, type ChatRepository } from './chatRepository';

export function associateChatGrupoFlow(
  chatId: string,
  grupoId: string,
  repo: ChatRepository = chatRepository
): Chat {
  if (!grupoId || grupoId.trim() === '') {
    throw new Error('Owner ID is required and cannot be empty.');
  }

  const chat = repo.getById(chatId);
  if (!chat) {
    throw new Error(`Chat with id ${chatId} not found.`);
  }

  if (chat.owner.type === 'enti') {
    throw new Error('Owner Enti is rejected in FIA-008 for Chat-Grupo association.');
  }

  // Update association
  chat.owner = {
    type: 'grupo',
    id: grupoId,
  };

  repo.save(chat);

  return chat;
}
