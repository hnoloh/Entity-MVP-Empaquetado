import type { Chat, ChatOwnerType } from './Chat';

export function createChat(id: string, ownerType: ChatOwnerType, ownerId: string): Chat {
  if (!ownerType || (ownerType !== 'enti' && ownerType !== 'grupo')) {
    throw new Error("Invalid owner type. Must be 'enti' or 'grupo'.");
  }
  if (!ownerId || ownerId.trim() === '') {
    throw new Error('Owner ID is required and cannot be empty.');
  }
  if (!id || id.trim() === '') {
    throw new Error('Chat ID is required and cannot be empty.');
  }

  return {
    id,
    owner: {
      type: ownerType,
      id: ownerId,
    },
    history: [],
  };
}
