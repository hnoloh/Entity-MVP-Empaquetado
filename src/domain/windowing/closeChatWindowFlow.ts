import type { ChatWindowRegistry } from './ChatWindowRegistry';

export function closeChatWindowFlow(registry: ChatWindowRegistry, windowId: string): boolean {
  if (!registry) {
    throw new Error('ChatWindowRegistry is required.');
  }
  if (!windowId || windowId.trim() === '') {
    throw new Error('windowId is required and cannot be empty.');
  }

  const existing = registry.getByWindowId(windowId);
  if (!existing) {
    return false; // windowId inexistente produce rechazo controlado sin mutación
  }
  // Delegar a la infraestructura (Clean Architecture)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('request-os-window-close', { 
      detail: { label: `chat-${existing.chatId}` } 
    }));
  }

  registry.unregister(windowId);
  return true;
}
