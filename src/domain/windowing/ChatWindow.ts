export type ChatWindowState = 'visible' | 'closed';

export interface ChatWindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChatWindow {
  windowId: string;
  chatId: string;
  state: ChatWindowState;
  geometry: ChatWindowGeometry;
}

export function createChatWindow(
  windowId: string,
  chatId: string,
  geometry: ChatWindowGeometry,
  state: ChatWindowState = 'visible'
): ChatWindow {
  if (!windowId || windowId.trim() === '') {
    throw new Error('windowId is required and cannot be empty.');
  }
  if (!chatId || chatId.trim() === '') {
    throw new Error('chatId is required and cannot be empty.');
  }
  if (state !== 'visible' && state !== 'closed') {
    throw new Error('state must be visible or closed.');
  }

  return {
    windowId,
    chatId,
    state,
    geometry: { ...geometry }
  };
}
