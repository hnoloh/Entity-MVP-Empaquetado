import { chatRepository } from './chatRepository';
import type { Chat } from './Chat';

export function clearChatHistoryFlow(chatId: string): Chat | null {
  if (!chatId || !chatId.trim()) return null;

  const chat = chatRepository.getById(chatId);
  if (!chat) return null;

  const updatedChat: Chat = {
    ...chat,
    history: []
  };

  chatRepository.save(updatedChat);
  return updatedChat;
}
