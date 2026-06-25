import { createChatWindow, type ChatWindow, type ChatWindowGeometry } from './ChatWindow';
import type { ChatWindowRegistry } from './ChatWindowRegistry';

export function openChatWindowFlow(
  chatId: string,
  registry: ChatWindowRegistry,
  windowId?: string,
  geometry?: ChatWindowGeometry
): ChatWindow {
  if (!chatId || chatId.trim() === '') {
    throw new Error('chatId is required and cannot be empty.');
  }
  if (!registry) {
    throw new Error('ChatWindowRegistry is required.');
  }

  const actualWindowId = windowId && windowId.trim() !== '' ? windowId : crypto.randomUUID();
  const actualGeometry = geometry || { x: 100, y: 100, width: 340, height: 560 };

  // Delegar a la infraestructura (Clean Architecture)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('request-os-window-open', {
      detail: { chatId, windowId: actualWindowId, geometry: actualGeometry }
    }));
  }
  
  // Registrar localmente para consistencia (la UI ignorará si no es en su scope)
  const win = createChatWindow(actualWindowId, chatId, actualGeometry, 'visible');
  registry.register(win);

  const registeredWin = registry.getByWindowId(actualWindowId);
  if (!registeredWin) {
    throw new Error('Failed to retrieve registered ChatWindow.');
  }

  return registeredWin;
}
