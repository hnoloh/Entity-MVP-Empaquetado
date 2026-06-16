import { chatRepository, type ChatRepository } from './chatRepository';
import type { Chat } from './Chat';

export function receiveResponseToChatFlow(
  chatId: string,
  text: string,
  repo: ChatRepository = chatRepository
): Chat {
  const chat = repo.getById(chatId);
  
  if (!chat) {
    throw new Error(`Chat with id ${chatId} not found`);
  }

  const trimmedText = text.trim();
  if (trimmedText === '') {
    throw new Error('Response text cannot be empty');
  }

  if (!chat.owner || (chat.owner.type !== 'enti' && chat.owner.type !== 'grupo')) {
    throw new Error('Chat has an invalid owner');
  }

  const message = {
    id: crypto.randomUUID(),
    role: 'assistant' as const,
    content: trimmedText,
    timestamp: Date.now()
  };

  chat.history.push(message);

  repo.save(chat);

  return chat;
}
