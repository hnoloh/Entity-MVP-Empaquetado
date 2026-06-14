import type { Chat } from './Chat';

export interface ChatRepository {
  save(chat: Chat): void;
  getById(id: string): Chat | undefined;
  list(): Chat[];
  delete(id: string): void;
  clear(): void;
}

class InMemoryChatRepository implements ChatRepository {
  private chats = new Map<string, Chat>();

  save(chat: Chat): void {
    // Definitive copy to prevent external mutation leaks
    this.chats.set(chat.id, JSON.parse(JSON.stringify(chat)));
  }

  getById(id: string): Chat | undefined {
    const chat = this.chats.get(id);
    return chat ? JSON.parse(JSON.stringify(chat)) : undefined;
  }

  list(): Chat[] {
    return Array.from(this.chats.values()).map(c => JSON.parse(JSON.stringify(c)));
  }

  delete(id: string): void {
    this.chats.delete(id);
  }

  clear(): void {
    this.chats.clear();
  }
}

export const chatRepository = new InMemoryChatRepository();
