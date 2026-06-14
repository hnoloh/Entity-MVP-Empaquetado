import { Chat } from './Chat';
import { chatRepository, ChatRepository } from './chatRepository';
import { entiRepository, EntiRepository } from '../enti/entiRepository';

export function associateChatEntiFlow(
  chatId: string,
  entiId: string,
  chatRepo: ChatRepository = chatRepository,
  entiRepo: EntiRepository = entiRepository
): Chat {
  if (!entiId || entiId.trim() === '') {
    throw new Error('Owner ID is required and cannot be empty.');
  }

  const enti = entiRepo.getById(entiId);
  if (!enti) {
    throw new Error(`Enti with id ${entiId} not found or is invalid.`);
  }

  const chat = chatRepo.getById(chatId);
  if (!chat) {
    throw new Error(`Chat with id ${chatId} not found.`);
  }

  if (chat.owner.type === 'grupo') {
    throw new Error('Owner Grupo is rejected in FIA-007.');
  }

  // Update association
  chat.owner = {
    type: 'enti',
    id: enti.id,
  };

  chatRepo.save(chat);

  return chat;
}
