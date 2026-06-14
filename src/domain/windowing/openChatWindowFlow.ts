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
  const actualGeometry = geometry || { x: 100, y: 100, width: 400, height: 600 };

  const win = createChatWindow(actualWindowId, chatId, actualGeometry, 'visible');
  
  registry.register(win);

  const registeredWin = registry.getByWindowId(actualWindowId);
  if (!registeredWin) {
    throw new Error('Failed to retrieve registered ChatWindow.');
  }

  return registeredWin;
}
