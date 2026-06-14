import { type ChatWindow } from './ChatWindow';

export interface ChatWindowRegistry {
  register(window: ChatWindow): void;
  getByWindowId(windowId: string): ChatWindow | null;
  findByChatId(chatId: string): ChatWindow[];
  list(): ChatWindow[];
  unregister(windowId: string): void;
}

export function createChatWindowRegistry(): ChatWindowRegistry {
  const registry = new Map<string, ChatWindow>();

  return {
    register(window: ChatWindow) {
      if (!window || !window.windowId || window.windowId.trim() === '') {
        throw new Error('windowId is required and cannot be empty.');
      }
      if (!window.chatId || window.chatId.trim() === '') {
        throw new Error('chatId is required and cannot be empty.');
      }
      if (window.state !== 'visible' && window.state !== 'closed') {
        throw new Error('state must be visible or closed.');
      }
      if (!window.geometry || typeof window.geometry.x !== 'number') {
        throw new Error('geometry must be valid.');
      }
      if (registry.has(window.windowId)) {
        throw new Error(`ChatWindow with windowId ${window.windowId} is already registered.`);
      }
      
      // Defensive copy
      registry.set(window.windowId, {
        windowId: window.windowId,
        chatId: window.chatId,
        state: window.state,
        geometry: { ...window.geometry }
      });
    },

    getByWindowId(windowId: string): ChatWindow | null {
      const win = registry.get(windowId);
      if (!win) return null;
      // Defensive copy
      return { ...win, geometry: { ...win.geometry } };
    },

    findByChatId(chatId: string): ChatWindow[] {
      const results: ChatWindow[] = [];
      for (const win of registry.values()) {
        if (win.chatId === chatId) {
          results.push({ ...win, geometry: { ...win.geometry } });
        }
      }
      return results;
    },

    list(): ChatWindow[] {
      return Array.from(registry.values()).map(win => ({
        ...win,
        geometry: { ...win.geometry }
      }));
    },

    unregister(windowId: string) {
      registry.delete(windowId);
    }
  };
}
