import { useState, useMemo, useEffect, useRef } from "react";
import type { WorkspaceState } from "../../types/WorkspaceState";
import WorkbenchRegion from "./WorkbenchRegion";
import { HubRegion } from "./HubRegion";
import { entiRepository } from "../../domain/enti/entiRepository";
import type { Enti } from "../../domain/enti/Enti";
import type { Group } from "../../domain/group/Group";
import { createGroupFlow } from "../../domain/group/createGroupFlow";
import { EntiEditor } from "./EntiEditor";
import { createChatWindowRegistry } from "../../domain/windowing/ChatWindowRegistry";
import { openChatWindowFlow } from "../../domain/windowing/openChatWindowFlow";
import { closeChatWindowFlow } from "../../domain/windowing/closeChatWindowFlow";
import { focusChatWindowFlow } from "../../domain/windowing/focusChatWindowFlow";
import { createChatFlow, chatRepository } from "../../domain/chat";
import { ChatWindowHost } from "../ChatWindow/ChatWindowHost";
import { GroupEditor } from "../Group/GroupEditor";
import { useAutosave } from "./useAutosave";
import "./WorkspaceShell.css";
import { checkIsTauri } from "../../utils/isTauri";

import { startEntityLifecycleFlow, closeEntityLifecycleFlow } from "../../domain/lifecycle";
let cachedIsTauri = checkIsTauri();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedWebviewWindow: any = null;
const creatingWindows = new Set<string>();

if (cachedIsTauri) {
  import('@tauri-apps/api/webviewWindow').then(({ WebviewWindow }) => {
    cachedWebviewWindow = WebviewWindow;
  });
}

export default function WorkspaceShell() {
  const [startupStatus, setStartupStatus] = useState<'pending' | 'success' | 'controlled_error' | 'blocked'>('pending');
  const [state, setState] = useState<WorkspaceState>("visible");
  const registry = useMemo(() => createChatWindowRegistry(), []);
  const [entis, setEntis] = useState<Enti[]>(() => entiRepository.list());
  const [grupos, setGrupos] = useState<Group[]>([]);
  // Multi-editor state
  const [openedEditorIds, setOpenedEditorIds] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [unsavedEntis, setUnsavedEntis] = useState<Record<string, Enti>>({});
  const [unsavedGrupos, setUnsavedGrupos] = useState<Record<string, Group>>({});
  const [liveDrafts, setLiveDrafts] = useState<Record<string, { name: string, draft?: Enti | Group }>>({});
  
  // For visual selection in the Hub
  const [focusedEntiId, setFocusedEntiId] = useState<string | null>(null);
  const [autoChatEnabled, setAutoChatEnabled] = useState(true);
  
  // Track open windows to highlight owners in Hub
  const [activeWindowOwnerIds, setActiveWindowOwnerIds] = useState<string[]>([]);
  const [triggerSave, setTriggerSave] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appWindow, setAppWindow] = useState<any>(null);

  useEffect(() => {
    if (checkIsTauri()) {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        setAppWindow(getCurrentWindow());
      });
    }
  }, []);

  // Hook de autosave
  useAutosave(entis, grupos, setGrupos, setEntis, triggerSave, startupStatus === 'success');

  // Multi-window sync
  const stateRef = useRef({ entis, grupos });
  useEffect(() => {
    stateRef.current = { entis, grupos };
    import('../../platform/desktop/MultiWindowSync').then(m => m.broadcastGroupsUpdate(grupos));
  }, [entis, grupos]);

  useEffect(() => {
    import('../../platform/desktop/MultiWindowSync').then(({ syncChannel }) => {
      const handleMsg = (e: MessageEvent) => {
        if (e.data.type === 'request_full_state') {
          syncChannel.postMessage({
            type: 'full_state',
            entis: entiRepository.list(),
            grupos: stateRef.current.grupos,
            chats: chatRepository.list()
          });
        } else if (e.data.type === 'chat_updated') {
          chatRepository.saveSilent(e.data.chat);
        }
      };
      syncChannel.addEventListener('message', handleMsg);
      return () => syncChannel.removeEventListener('message', handleMsg);
    });
  }, []);

  useEffect(() => {
    // RV-08/FIA-001: Arranque Entity
    const result = startEntityLifecycleFlow({
      explicitApplicationAction: true,
      storageAvailable: true, // We assume true for now, error handling will naturally fall to controlled_error if IDB fails.
      workspaceShellMounted: true
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStartupStatus(result.status);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const activeWindows = registry.list().filter(w => w.state === 'visible');
      const ownerIds = activeWindows.map(w => {
        const chat = chatRepository.getById(w.chatId);
        return chat ? chat.owner.id : null;
      }).filter(Boolean) as string[];

      setActiveWindowOwnerIds(prev => {
        if (prev.length !== ownerIds.length) return ownerIds;
        const diff = prev.some((id, idx) => id !== ownerIds[idx]);
        return diff ? ownerIds : prev;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [registry]);

  useEffect(() => {
    const unsub = chatRepository.subscribe(() => {
      // Forzar un render o tick para el autosave al cambiar un chat
      setTriggerSave(prev => prev + 1);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleOsWindowClose = (e: CustomEvent) => {
      if (cachedIsTauri && cachedWebviewWindow) {
        cachedWebviewWindow.getByLabel(e.detail.label).then((w: any) => {
          if (w) w.close();
        });
      }
    };
    window.addEventListener('request-os-window-close', handleOsWindowClose as EventListener);
    return () => window.removeEventListener('request-os-window-close', handleOsWindowClose as EventListener);
  }, []);

  useEffect(() => {
    const handleOsWindowOpen = (e: CustomEvent) => {
      const { chatId, geometry } = e.detail;
      if (cachedIsTauri && cachedWebviewWindow) {
        const label = `chat-${chatId}`;
        
        if (creatingWindows.has(label)) return;
        
        creatingWindows.add(label);
        
        // Si no existe, la creamos
        let title = `Chat`;
          const chat = chatRepository.getById(chatId);
          if (chat) {
            if (chat.owner.type === 'enti') {
              const enti = entiRepository.getById(chat.owner.id);
              if (enti) title = enti.name;
            } else {
              title = `Grupo`;
            }
          }

          const webview = new cachedWebviewWindow(label, {
            url: `/?chatId=${chatId}`,
            title: title,
            width: geometry.width,
            height: geometry.height,
            center: true,
            decorations: false,
            visible: true,
            transparent: true
          });
          
          webview.once('tauri://error', (err: any) => {
            console.error('Tauri WebviewWindow error', err);
            creatingWindows.delete(label);
          });
          webview.once('tauri://created', () => {
            creatingWindows.delete(label);
          });
          // Timeout de seguridad por si tauri://created falla
          setTimeout(() => creatingWindows.delete(label), 2000);
      }
    };
    window.addEventListener('request-os-window-open', handleOsWindowOpen as EventListener);
    return () => window.removeEventListener('request-os-window-open', handleOsWindowOpen as EventListener);
  }, []);

  const handleCreateEnti = () => {
    const id = `enti-${Date.now()}`;
    const newEnti = {
      id,
      name: "",
      type: "enti" as const,
      status: "incomplete" as const,
      harness: { function: "", rules: [], workMaterial: "", knowledge: "" },
      cognitiveConfig: { mode: "unconfigured" as const },
      capabilities: []
    };
    setUnsavedEntis(prev => ({ ...prev, [id]: newEnti }));
    setOpenedEditorIds(prev => {
      if (!prev.includes(id)) return [...prev, id];
      return prev;
    });
    setActiveTabId(id);
    setFocusedEntiId(id);
  };

  const handleCreateGrupo = () => {
    const id = `grupo-${Date.now()}`;
    const newGrupo = createGroupFlow(id);
    setUnsavedGrupos(prev => ({ ...prev, [id]: newGrupo }));
    setOpenedEditorIds(prev => {
      if (!prev.includes(id)) return [...prev, id];
      return prev;
    });
    setActiveTabId(id);
    setFocusedEntiId(id);
  };

  const handleOpenChat = (id: string, type: 'enti' | 'grupo') => {
    let chat = chatRepository.list().find(c => c.owner.type === type && c.owner.id === id);
    if (!chat) {
      chat = createChatFlow(type, id);
    }
    
    // Delegamos la apertura al flujo de dominio, la infraestructura (los listeners) se encargará
    // de abrir la ventana OS si es necesario.
    if (cachedIsTauri) {
      openChatWindowFlow(chat!.id, registry);
      return;
    }

    // Fallback in-app
    const existingWindows = registry.findByChatId(chat!.id);
    if (existingWindows.length === 0) {
      openChatWindowFlow(chat!.id, registry);
    } else {
      focusChatWindowFlow(registry, existingWindows[0].windowId);
      window.dispatchEvent(new CustomEvent('request-focus-window', { detail: { windowId: existingWindows[0].windowId } }));
    }
  };

  const handleSelectEnti = (id: string) => {
    setOpenedEditorIds(prev => {
      if (!prev.includes(id)) return [...prev, id];
      return prev;
    });
    setActiveTabId(id);
    setFocusedEntiId(id);
    if (autoChatEnabled) handleOpenChat(id, 'enti');
  };

  const handleSelectGrupo = (id: string) => {
    setOpenedEditorIds(prev => {
      if (!prev.includes(id)) return [...prev, id];
      return prev;
    });
    setActiveTabId(id);
    setFocusedEntiId(id);
    if (autoChatEnabled) handleOpenChat(id, 'grupo');
  };

  const handleSelectTab = (id: string) => {
    setActiveTabId(id);
    setFocusedEntiId(id);
  };

  const handleSaveEnti = (draft: Enti) => {
    entiRepository.save(draft);
    setEntis(entiRepository.list());
    setUnsavedEntis(prev => {
      if (prev[draft.id]) {
        const next = { ...prev };
        delete next[draft.id];
        return next;
      }
      return prev;
    });
  };

  const handleCloseEditor = (id: string) => {
    setOpenedEditorIds(prev => prev.filter(openId => openId !== id));
    
    // Si la pestaña que se cierra es la activa, cambiar a la última pestaña disponible
    if (activeTabId === id) {
      const next = openedEditorIds.filter(openId => openId !== id);
      setActiveTabId(next.length > 0 ? next[next.length - 1] : null);
    }
    setUnsavedEntis(prev => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return prev;
    });
    setUnsavedGrupos(prev => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return prev;
    });
    if (focusedEntiId === id) {
      setFocusedEntiId(null);
    }
    setLiveDrafts(prev => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return prev;
    });

    // Cerrar las ventanas de chat asociadas al cerrar el editor
    const associatedChat = chatRepository.list().find(c => c.owner.id === id);
    if (associatedChat) {
      const windows = registry.findByChatId(associatedChat.id);
      windows.forEach(win => closeChatWindowFlow(registry, win.windowId));
    }
  };

  const handleDeleteEnti = (id: string) => {
    // 1. Eliminar de repositorio y UI
    entiRepository.delete(id);
    setEntis(entiRepository.list());
    handleCloseEditor(id);

    // 2. Eliminar chat asociado y cerrar su ventana si estuviera abierta
    const associatedChat = chatRepository.list().find(c => c.owner.type === 'enti' && c.owner.id === id);
    if (associatedChat) {
      const windows = registry.findByChatId(associatedChat.id);
      windows.forEach(win => {
        closeChatWindowFlow(registry, win.windowId);
      });
      chatRepository.delete(associatedChat.id);
    }
  };

  const handleDeleteGrupo = (id: string) => {
    setGrupos(prev => prev.filter(g => g.id !== id));
    handleCloseEditor(id);

    const associatedChat = chatRepository.list().find(c => c.owner.type === 'grupo' && c.owner.id === id);
    if (associatedChat) {
      const windows = registry.findByChatId(associatedChat.id);
      windows.forEach(win => {
        closeChatWindowFlow(registry, win.windowId);
      });
      chatRepository.delete(associatedChat.id);
    }
  };

  const handleCloseRequest = (id: string) => {
    window.dispatchEvent(new CustomEvent('request-close-editor', { detail: { id } }));
  };

  const handleSaveGrupo = (draft: Group) => {
    setGrupos(prev => {
      const exists = prev.some(g => g.id === draft.id);
      if (exists) {
        return prev.map(g => g.id === draft.id ? draft : g);
      }
      return [...prev, draft];
    });
    setUnsavedGrupos(prev => {
      if (prev[draft.id]) {
        const next = { ...prev };
        delete next[draft.id];
        return next;
      }
      return prev;
    });
  };

  const activeTabs = openedEditorIds.map(id => {
    const liveDraft = liveDrafts[id];
    const unsavedEnti = unsavedEntis[id];
    const enti = entiRepository.getById(id);
    if (unsavedEnti || enti) {
      const name = liveDraft?.name ?? ((unsavedEnti || enti)!.name || 'Nuevo Enti');
      return { id, name, type: 'enti' };
    }
    const grupo = grupos.find(g => g.id === id) || unsavedGrupos[id];
    if (grupo) {
      const name = liveDraft?.name ?? (grupo.name || 'Nuevo Grupo');
      return { id, name, type: 'grupo' };
    }
    return undefined;
  }).filter((t): t is { id: string, name: string, type: 'enti'|'grupo' } => t !== undefined);

  const editorStubs = activeTabs.map(tab => {
    if (tab.type === 'enti') {
      const enti = unsavedEntis[tab.id] || entiRepository.getById(tab.id)!;
      return (
        <EntiEditor
          key={enti.id}
          enti={enti}
          isActive={activeTabId === enti.id}
          onSave={handleSaveEnti}
          onClose={() => handleCloseEditor(enti.id)}
          onDraftChange={(draft) => setLiveDrafts(prev => ({ ...prev, [enti.id]: { name: draft.name, draft } }))}
          onRequestOpenChat={() => autoChatEnabled && handleOpenChat(enti.id, 'enti')}
        />
      );
    } else {
      const grupo = grupos.find(g => g.id === tab.id) || unsavedGrupos[tab.id]!;
      return (
        <GroupEditor
          key={grupo.id}
          group={grupo}
          isActive={activeTabId === grupo.id}
          onSave={handleSaveGrupo}
          onClose={() => handleCloseEditor(grupo.id)}
          availableEntis={entis}
          onDraftChange={(draft) => setLiveDrafts(prev => ({ ...prev, [grupo.id]: { name: draft.name, draft } }))}
        />
      );
    }
  });

  const handleToggleState = () => {
    setState((prev) => {
      if (prev === "visible") return "minimizado";
      if (prev === "minimizado") return "restaurado";
      return "visible";
    });
  };



  const handleCloseApp = () => {
    const result = closeEntityLifecycleFlow({
      explicitUserAction: true,
      platformCloseEvent: false,
      workspaceShellMounted: true,
      currentStartupStatus: startupStatus
    });

    if (result.status === 'success') {
      setState('cerrado' as WorkspaceState);
    } else {
      console.error('Failed to close application:', result.error);
    }
  };

  const handleMinimizeOS = () => {
    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      getCurrentWindow().minimize();
    });
  };

  const handleCloseOS = () => {
    import('../../platform/desktop/MultiWindowSync').then(m => {
      m.syncChannel.postMessage({ type: 'app_closing' });
    });
    if (appWindow) {
      setTimeout(() => appWindow.close(), 100);
    } else {
      setTimeout(() => handleCloseApp(), 100);
    }
  };

  const displayEntis = useMemo(() => {
    return entis.map(e => {
      const draft = liveDrafts[e.id]?.draft as Enti | undefined;
      return draft ? { ...draft, status: e.status } : (unsavedEntis[e.id] || e);
    }).concat(
      Object.values(unsavedEntis).filter(draft => !entis.some(e => e.id === draft.id)).map(draft => (liveDrafts[draft.id]?.draft as Enti) || draft)
    );
  }, [entis, unsavedEntis, liveDrafts]);

  const displayGrupos = useMemo(() => {
    return grupos.map(g => {
      const draft = liveDrafts[g.id]?.draft as Group | undefined;
      return draft ? { ...draft } : (unsavedGrupos[g.id] || g);
    }).concat(
      Object.values(unsavedGrupos).filter(draft => !grupos.some(g => g.id === draft.id)).map(draft => (liveDrafts[draft.id]?.draft as Group) || draft)
    );
  }, [grupos, unsavedGrupos, liveDrafts]);

  if (startupStatus === 'pending') {
    return <div className="workspace-shell-loading">Iniciando Entity...</div>;
  }

  if (state === 'cerrado') {
    return null;
  }

  if (startupStatus === 'controlled_error') {
    return <div className="workspace-shell-error">Error controlado durante el arranque.</div>;
  }

  if (startupStatus === 'blocked') {
    return <div className="workspace-shell-blocked">Arranque bloqueado.</div>;
  }

  return (
    <div
      data-testid="workspace-shell"
      data-state={state}
      className={`workspace-shell state-${state}`}
    >
      {/* Área invisible para arrastrar la ventana */}
      <div 
        data-tauri-drag-region="true"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40px', zIndex: 9998, cursor: 'grab', background: 'rgba(0,0,0,0.01)' }} 
      />

      {/* Controles de ventana nativa (Top-Right) */}
      <div className="app-window-controls no-drag">
        <button onClick={handleMinimizeOS} className="window-btn minimize-btn" title="Minimizar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="12" x2="20" y2="12"></line>
          </svg>
        </button>
        <button onClick={handleCloseOS} className="window-btn close-btn" title="Cerrar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="workspace-content">
        <HubRegion 
           entis={displayEntis} 
           openEntiIds={Array.from(new Set([...openedEditorIds, ...activeWindowOwnerIds]))}
           onCreateEnti={handleCreateEnti} 
           onSelectEnti={handleSelectEnti}
           onDeleteEnti={handleDeleteEnti}
           grupos={displayGrupos}
           onCreateGrupo={handleCreateGrupo}
           onSelectGrupo={handleSelectGrupo}
           onDeleteGrupo={handleDeleteGrupo}
           autoChatEnabled={autoChatEnabled}
           onToggleAutoChat={() => setAutoChatEnabled(!autoChatEnabled)}
        />
        <WorkbenchRegion 
           editorStubs={editorStubs}
           activeTabs={activeTabs}
           activeTabId={activeTabId}
           onSelectTab={handleSelectTab}
           onCloseTab={handleCloseRequest}
        />
      </div>
      
      <ChatWindowHost registry={registry} grupos={grupos} />

      {/* Botón temporal de prueba para cambiar estado */}
      <button
        data-testid="toggle-state-btn"
        onClick={handleToggleState}
        style={{ display: "none" }}
      >
        Toggle
      </button>
    </div>
  );
}
