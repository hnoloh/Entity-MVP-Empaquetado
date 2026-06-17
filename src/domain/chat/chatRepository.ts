import type { Chat } from './Chat';

export interface ChatRepository {
  save(chat: Chat): void;
  getById(id: string): Chat | undefined;
  getSnapshot(id: string): Chat | undefined;
  list(): Chat[];
  delete(id: string): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

class InMemoryChatRepository implements ChatRepository {
  private chats = new Map<string, Chat>();
  private snapshots = new Map<string, Chat>();
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    this.listeners.forEach(l => l());
  }

  private cachedSnapshots = new Map<string, Chat>();

  save(chat: Chat): void {
    const cloned = JSON.parse(JSON.stringify(chat));
    this.chats.set(chat.id, cloned);
    this.snapshots.set(chat.id, cloned);
    this.cachedSnapshots.delete(chat.id);
    this.emit();
  }

  getById(id: string): Chat | undefined {
    const chat = this.snapshots.get(id);
    return chat ? JSON.parse(JSON.stringify(chat)) : undefined;
  }

  getSnapshot(id: string): Chat | undefined {
    const chat = this.snapshots.get(id);
    if (!chat) return undefined;
    if (!this.cachedSnapshots.has(id)) {
      this.cachedSnapshots.set(id, JSON.parse(JSON.stringify(chat)));
    }
    return this.cachedSnapshots.get(id);
  }

  list(): Chat[] {
    return Array.from(this.snapshots.values()).map(c => JSON.parse(JSON.stringify(c)));
  }

  delete(id: string): void {
    this.chats.delete(id);
    this.snapshots.delete(id);
    this.cachedSnapshots.delete(id);
    this.emit();
  }

  clear(): void {
    this.chats.clear();
    this.snapshots.clear();
    this.cachedSnapshots.clear();
    this.emit();
  }
}

export const chatRepository = new InMemoryChatRepository();
