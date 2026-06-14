import type { ChatWindowRegistry } from './ChatWindowRegistry';

export function repositionChatWindowFlow(
  registry: ChatWindowRegistry,
  windowId: string,
  position: { x: number; y: number }
): boolean {
  if (!registry) {
    throw new Error('ChatWindowRegistry is required.');
  }
  if (!windowId || windowId.trim() === '') {
    return false; // rechazo controlado sin mutación
  }
  if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    return false;
  }

  const existing = registry.getByWindowId(windowId);
  if (!existing) {
    return false;
  }

  existing.geometry.x = position.x;
  existing.geometry.y = position.y;
  registry.update(existing);

  return true;
}
