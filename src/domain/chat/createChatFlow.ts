import { createChat } from './createChat';
import { chatRepository, type ChatRepository } from './chatRepository';
import type { Chat, ChatOwnerType } from './Chat';

export function createChatFlow(ownerType: ChatOwnerType, ownerId: string, repo: ChatRepository = chatRepository): Chat {
  if (!ownerType || (ownerType !== 'enti' && ownerType !== 'grupo')) {
    throw new Error("Invalid owner type. Must be 'enti' or 'grupo'.");
  }
  if (!ownerId || ownerId.trim() === '') {
    throw new Error('Owner ID is required and cannot be empty.');
  }

  if (ownerType === 'grupo') {
    const existing = repo.list().find(c => c.owner.type === 'grupo' && c.owner.id === ownerId);
    if (existing) {
      return existing;
    }
  }

  const id = crypto.randomUUID();
  const chat = createChat(id, ownerType, ownerId);

  repo.save(chat);

  return chat;
}
