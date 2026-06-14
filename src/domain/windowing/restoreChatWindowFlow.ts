import type { ChatWindowRegistry } from './ChatWindowRegistry';

export function restoreChatWindowFlow(registry: ChatWindowRegistry, windowId: string): boolean {
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

  if (existing.state === 'visible') {
    return true; // idempotente
  }

  if (existing.state === 'closed') {
    return false; // no se restaura desde closed
  }

  existing.state = 'visible';
  registry.update(existing);

  return true;
}
