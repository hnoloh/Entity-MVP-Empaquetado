import { chatRepository, type ChatRepository } from './chatRepository';

export interface OpenChatResult {
  chatId: string;
  ownerType: 'enti' | 'grupo';
  ownerId: string;
  openedAt: number;
}

export function openChatFlow(
  chatId: string,
  repo: ChatRepository = chatRepository
): OpenChatResult {
  if (!chatId || chatId.trim() === '') {
    throw new Error('chatId is required and cannot be empty.');
  }

  const chat = repo.getById(chatId);
  if (!chat) {
    throw new Error(`Chat with id ${chatId} not found. Cannot open nonexistent chat.`);
  }

  if (!chat.owner || !chat.owner.type || !chat.owner.id) {
    throw new Error(`Chat ${chatId} has no explicit owner.`);
  }

  if (chat.owner.type !== 'enti' && chat.owner.type !== 'grupo') {
    throw new Error(`Chat ${chatId} has invalid owner type: ${chat.owner.type}`);
  }

  // Idempotent open result (pure domain/data logic, no persistence of the "open" state)
  return {
    chatId: chat.id,
    ownerType: chat.owner.type,
    ownerId: chat.owner.id,
    openedAt: Date.now()
  };
}
