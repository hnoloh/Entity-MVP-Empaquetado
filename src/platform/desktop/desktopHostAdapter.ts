/**
 * Minimal adapter to act as a bridge between the web workspace and the future desktop host.
 * Currently it defaults to a web fallback as no framework (Tauri/Electron) is selected yet.
 */
export interface DesktopHostAdapter {
  isDesktopMode: () => boolean;
  getPlatformName: () => string;
}

export const desktopHostAdapter: DesktopHostAdapter = {
  isDesktopMode: () => {
    // To be implemented via __TAURI__ or process.versions.electron later.
    return false;
  },
  getPlatformName: () => {
    return 'web-fallback';
  }
};
