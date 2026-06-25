import { chatRepository } from './chatRepository';
import type { Chat } from './Chat';
import { attachmentsStore } from '../../components/Chat/attachmentsStore';
import { attachmentContentRepository } from '../attachments/attachmentContentRepository';
import { generatedArtifactRegistry } from '../tools/generated-artifacts';

export function clearChatHistoryFlow(chatId: string): Chat | null {
  if (!chatId || !chatId.trim()) return null;

  const chat = chatRepository.getById(chatId);
  if (!chat) return null;

  const updatedChat: Chat = {
    ...chat,
    history: []
  };

  chatRepository.save(updatedChat);
  
  // Clear from attachmentsStore directly
  attachmentsStore.clearChat(chatId);
  
  // Clear from attachmentContentRepository
  const keysToDelete: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [key, entry] of (attachmentContentRepository as any).store.entries()) {
    if (entry.chatId === chatId) {
      keysToDelete.push(key);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keysToDelete.forEach(key => (attachmentContentRepository as any).store.delete(key));

  // Clear from generatedArtifactRegistry if it's an enti
  if (chat.owner.type === 'enti') {
    const entiId = chat.owner.id;
    const artifactsKeys: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const [key, artifact] of (generatedArtifactRegistry as any).artifacts.entries()) {
      if (artifact.entiId === entiId) {
        artifactsKeys.push(key);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    artifactsKeys.forEach(key => (generatedArtifactRegistry as any).artifacts.delete(key));
  }

  return updatedChat;
}
