import { chatRepository, type ChatRepository } from './chatRepository';

export interface CloseChatResult {
  chatId: string;
  closedAt: number;
}

export function closeChatFlow(
  chatId: string,
  repo: ChatRepository = chatRepository
): CloseChatResult {
  if (!chatId || chatId.trim() === '') {
    throw new Error('chatId is required and cannot be empty.');
  }

  // Verificar que existe en el repositorio (no muta ni borra)
  const chat = repo.getById(chatId);
  if (!chat) {
    throw new Error(`Chat with id ${chatId} not found. Cannot close nonexistent chat.`);
  }

  // No mutamos el owner, no limpiamos historial, no borramos el chat.
  // Retornamos un resultado in-memory idempotente
  return {
    chatId: chat.id,
    closedAt: Date.now()
  };
}
