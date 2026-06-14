import { createChat } from './createChat';
import { chatRepository, ChatRepository } from './chatRepository';
import type { Chat, ChatOwnerType } from './Chat';

export function createChatFlow(ownerType: ChatOwnerType, ownerId: string, repo: ChatRepository = chatRepository): Chat {
  if (!ownerType || (ownerType !== 'enti' && ownerType !== 'grupo')) {
    throw new Error("Invalid owner type. Must be 'enti' or 'grupo'.");
  }
  if (!ownerId || ownerId.trim() === '') {
    throw new Error('Owner ID is required and cannot be empty.');
  }

  const id = crypto.randomUUID();
  const chat = createChat(id, ownerType, ownerId);

  repo.save(chat);

  return chat;
}
