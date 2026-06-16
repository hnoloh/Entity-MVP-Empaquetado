import React, { useState, useMemo, useEffect } from "react";
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
import "./WorkspaceShell.css";

export default function WorkspaceShell() {
  const [state, setState] = useState<WorkspaceState>("visible");
  const registry = useMemo(() => createChatWindowRegistry(), []);
  const [entis, setEntis] = useState<Enti[]>(() => entiRepository.list());
  const [grupos, setGrupos] = useState<Group[]>([]);
  // Multi-editor state
  const [openedEditorIds, setOpenedEditorIds] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [unsavedEntis, setUnsavedEntis] = useState<Record<string, Enti>>({});
  const [unsavedGrupos, setUnsavedGrupos] = useState<Record<string, Group>>({});
  const [liveDrafts, setLiveDrafts] = useState<Record<string, { name: string }>>({});
  
  // For visual selection in the Hub
  const [focusedEntiId, setFocusedEntiId] = useState<string | null>(null);
  
  // Track open windows to highlight owners in Hub
  const [activeWindowOwnerIds, setActiveWindowOwnerIds] = useState<string[]>([]);

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
  };

  const handleOpenChat = (id: string, type: 'enti' | 'grupo') => {
    let chat = chatRepository.list().find(c => c.owner.type === type && c.owner.id === id);
    if (!chat) {
      chat = createChatFlow(type, id);
    }
    // Abrir ventana (o enfocar si ya existe)
    const existingWindows = registry.findByChatId(chat.id);
    if (existingWindows.length === 0) {
      openChatWindowFlow(chat.id, registry);
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
    handleOpenChat(id, 'enti');
  };

  const handleSelectGrupo = (id: string) => {
    setOpenedEditorIds(prev => {
      if (!prev.includes(id)) return [...prev, id];
      return prev;
    });
    setActiveTabId(id);
    handleOpenChat(id, 'grupo');
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
    setOpenedEditorIds(prev => {
      const next = prev.filter(openId => openId !== id);
      if (activeTabId === id) {
        setActiveTabId(next.length > 0 ? next[next.length - 1] : null);
      }
      return next;
    });
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
          onNameChange={(name) => setLiveDrafts(prev => ({ ...prev, [enti.id]: { name } }))}
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
          onNameChange={(name) => setLiveDrafts(prev => ({ ...prev, [grupo.id]: { name } }))}
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

  return (
    <div
      data-testid="workspace-shell"
      data-state={state}
      className={`workspace-shell state-${state}`}
    >
      {/* Top Bar Placeholder - Anteriormente malinterpretado como HubRegion */}
      <div
        className="top-bar-placeholder"
        style={{ height: "40px", flexShrink: 0 }}
      ></div>

      <div className="workspace-content">
        <HubRegion 
           entis={entis} 
           openEntiIds={Array.from(new Set([...openedEditorIds, ...activeWindowOwnerIds]))}
           onCreateEnti={handleCreateEnti} 
           onSelectEnti={handleSelectEnti}
           onDeleteEnti={handleDeleteEnti}
           grupos={grupos}
           onCreateGrupo={handleCreateGrupo}
           onSelectGrupo={handleSelectGrupo}
           onDeleteGrupo={handleDeleteGrupo}
           onOpenChat={handleOpenChat}
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
