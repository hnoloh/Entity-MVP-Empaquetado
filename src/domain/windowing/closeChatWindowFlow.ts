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

  registry.unregister(windowId);
  return true;
}
