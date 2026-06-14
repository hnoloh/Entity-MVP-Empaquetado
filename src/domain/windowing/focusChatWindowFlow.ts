import type { ChatWindowRegistry } from './ChatWindowRegistry';

export function focusChatWindowFlow(
  registry: ChatWindowRegistry,
  windowId: string
): string | null {
  if (!registry) {
    throw new Error('ChatWindowRegistry is required.');
  }
  if (!windowId || windowId.trim() === '') {
    return registry.getFocusedWindowId();
  }

  const existing = registry.getByWindowId(windowId);
  if (!existing) {
    return registry.getFocusedWindowId();
  }

  registry.focus(windowId);
  return registry.getFocusedWindowId();
}
