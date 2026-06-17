export type ChatWindowState = 'visible' | 'closed' | 'minimized';

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
  lastFocusedAt?: number;
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
  if (state !== 'visible' && state !== 'closed' && state !== 'minimized') {
    throw new Error('state must be visible, closed or minimized.');
  }

  return {
    windowId,
    chatId,
    state,
    geometry: { ...geometry },
    lastFocusedAt: Date.now()
  };
}
