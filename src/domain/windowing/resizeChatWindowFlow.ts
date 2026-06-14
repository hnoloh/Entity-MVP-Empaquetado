import type { ChatWindowRegistry } from './ChatWindowRegistry';

export function resizeChatWindowFlow(
  registry: ChatWindowRegistry,
  windowId: string,
  size: { width: number; height: number }
): boolean {
  if (!registry) {
    throw new Error('ChatWindowRegistry is required.');
  }
  if (!windowId || windowId.trim() === '') {
    return false; // rechazo controlado sin mutación
  }
  if (!size || typeof size.width !== 'number' || typeof size.height !== 'number' || !Number.isFinite(size.width) || !Number.isFinite(size.height)) {
    return false;
  }
  if (size.width < 0 || size.height < 0) {
    return false;
  }

  const existing = registry.getByWindowId(windowId);
  if (!existing) {
    return false;
  }

  existing.geometry.width = size.width;
  existing.geometry.height = size.height;
  registry.update(existing);

  return true;
}
