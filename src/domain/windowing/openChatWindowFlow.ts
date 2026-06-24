import { createChatWindow, type ChatWindow, type ChatWindowGeometry } from './ChatWindow';
import type { ChatWindowRegistry } from './ChatWindowRegistry';
import { checkIsTauri } from '../../utils/isTauri';
import { chatRepository } from '../chat/chatRepository';
import { entiRepository } from '../enti/entiRepository';

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

  if (checkIsTauri()) {
    import('@tauri-apps/api/webviewWindow').then(({ WebviewWindow }) => {
      const label = `chat-${chatId}`;
      let title = `Chat`;
      const chat = chatRepository.getById(chatId);
      if (chat) {
        if (chat.owner.type === 'enti') {
          const enti = entiRepository.getById(chat.owner.id);
          if (enti) title = enti.name;
        } else {
          title = `Grupo`;
        }
      }

      const webview = new WebviewWindow(label, {
        url: `/?chatId=${chatId}`,
        title: title,
        width: actualGeometry.width,
        height: actualGeometry.height,
        center: true,
        decorations: false,
        visible: false,
        transparent: true
      });
      webview.once('tauri://error', (e) => {
        console.error('Tauri WebviewWindow error', e);
        alert('Error creating native window: ' + JSON.stringify(e));
      });
    }).catch(e => {
      console.error('Failed to import Tauri module', e);
    });
    // Fall back to returning a "fake" window to satisfy registry if needed, or don't register
    // Wait, the caller expects a ChatWindow back!
    const win = createChatWindow(actualWindowId, chatId, actualGeometry, 'visible');
    // We register it so the registry knows it exists, but ChatWindowView will ignore it.
    registry.register(win);
    return win;
  }

  const win = createChatWindow(actualWindowId, chatId, actualGeometry, 'visible');
  
  registry.register(win);

  const registeredWin = registry.getByWindowId(actualWindowId);
  if (!registeredWin) {
    throw new Error('Failed to retrieve registered ChatWindow.');
  }

  return registeredWin;
}
