export interface DesktopHostCompatibilityItem {
  id: string;
  category: 'routes' | 'assets' | 'storage' | 'object_urls' | 'web_apis' | 'entis' | 'chats';
  description: string;
  status: 'pending' | 'resolved' | 'not_applicable';
  notes?: string;
}

export const desktopHostCompatibilityChecklist: DesktopHostCompatibilityItem[] = [
  {
    id: 'routes_base_path',
    category: 'routes',
    description: 'Ensure router works with file:// or tauri:// protocols without 404s on reload',
    status: 'pending',
  },
  {
    id: 'assets_loading',
    category: 'assets',
    description: 'Ensure static assets load correctly using relative paths rather than absolute root /',
    status: 'pending',
  },
  {
    id: 'storage_persistence',
    category: 'storage',
    description: 'Verify if localStorage/IndexedDB persist correctly across desktop app restarts',
    status: 'pending',
  },
  {
    id: 'object_urls_downloads',
    category: 'object_urls',
    description: 'URL.createObjectURL blob downloads might need replacement with native fs write APIs',
    status: 'pending',
  },
  {
    id: 'web_apis_clipboard',
    category: 'web_apis',
    description: 'Check clipboard API compatibility in desktop webview',
    status: 'pending',
  },
  {
    id: 'entis_integration',
    category: 'entis',
    description: 'Verify Entis list, selection, and isolation work correctly inside desktop host without parallel storage',
    status: 'pending',
  },
  {
    id: 'chats_integration',
    category: 'chats',
    description: 'Verify ChatView, ChatWindow, input focus, DnD, scroll/historial, object URLs conversacionales y persistencia de historial en desktop host',
    status: 'pending',
  },
  {
    id: 'fia011_integration',
    category: 'entis',
    description: 'Verify MVP Functional Readiness Gate and Validation Result (RV09/FIA-011)',
    status: 'pending',
  }
];
