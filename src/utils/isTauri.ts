export function checkIsTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ || !!(window as unknown as Record<string, unknown>).__TAURI_IPC__ || !!(window as unknown as Record<string, unknown>).isTauri;
}
