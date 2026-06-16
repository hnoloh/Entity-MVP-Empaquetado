import { chatRepository, type ChatRepository } from './chatRepository';
import type { ChatMessage } from './Chat';

export function getChatHistoryFlow(
  chatId: string,
  repo: ChatRepository = chatRepository
): ChatMessage[] {
  const chat = repo.getById(chatId);

  if (!chat) {
    throw new Error(`Chat with id ${chatId} not found`);
  }

  // Copia defensiva para prevenir fuga de mutabilidad
  return JSON.parse(JSON.stringify(chat.history));
}
