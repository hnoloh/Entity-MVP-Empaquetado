import type { ChatWindowRegistry } from './ChatWindowRegistry';

export function minimizeChatWindowFlow(registry: ChatWindowRegistry, windowId: string): boolean {
  if (!registry) {
    throw new Error('ChatWindowRegistry is required.');
  }
  if (!windowId || windowId.trim() === '') {
    return false; // rechazo controlado sin mutación
  }

  const existing = registry.getByWindowId(windowId);
  if (!existing) {
    return false;
  }

  if (existing.state === 'minimized') {
    return true; // idempotente
  }

  existing.state = 'minimized';
  registry.update(existing);

  return true;
}
