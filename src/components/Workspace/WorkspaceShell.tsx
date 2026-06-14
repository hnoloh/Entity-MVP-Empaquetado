import { useState } from "react";
import type { WorkspaceState } from "../../types/WorkspaceState";
import WorkbenchRegion from "./WorkbenchRegion";
import { HubRegion } from "./HubRegion";
import { entiRepository } from "../../domain/enti/entiRepository";
import type { Enti } from "../../domain/enti/Enti";
import type { Group } from "../../domain/group/Group";
import { createGroupFlow } from "../../domain/group/createGroupFlow";
import { EntiEditor } from "./EntiEditor";
import "./WorkspaceShell.css";

export default function WorkspaceShell() {
  const [state, setState] = useState<WorkspaceState>("visible");
  const [entis, setEntis] = useState<Enti[]>(() => entiRepository.list());
  const [grupos, setGrupos] = useState<Group[]>([]);
  // Multi-editor state
  const [openedEntiIds, setOpenedEntiIds] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [unsavedEntis, setUnsavedEntis] = useState<Record<string, Enti>>({});
  
  // For visual selection in the Hub
  const [focusedEntiId, setFocusedEntiId] = useState<string | null>(null);

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
    setOpenedEntiIds(prev => {
      if (!prev.includes(id)) return [...prev, id];
      return prev;
    });
    setActiveTabId(id);
    setFocusedEntiId(id);
  };

  const handleCreateGrupo = () => {
    const id = `grupo-${Date.now()}`;
    const newGrupo = createGroupFlow(id);
    setGrupos(prev => [...prev, newGrupo]);
  };

  const handleSelectEnti = (id: string) => {
    setOpenedEntiIds(prev => {
      if (!prev.includes(id)) return [...prev, id];
      return prev;
    });
    setActiveTabId(id);
    setFocusedEntiId(id);
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
    setOpenedEntiIds(prev => {
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
    if (focusedEntiId === id) {
      setFocusedEntiId(null);
    }
  };

  const handleDeleteEnti = (id: string) => {
    entiRepository.delete(id);
    setEntis(entiRepository.list());
    handleCloseEditor(id);
  };

  const handleCloseRequest = (id: string) => {
    window.dispatchEvent(new CustomEvent('request-close-editor', { detail: { id } }));
  };

  const activeEntis = openedEntiIds.map(id => {
    return unsavedEntis[id] || entiRepository.getById(id);
  }).filter((e): e is Enti => e !== undefined);

  const editorStubs = activeEntis.map(enti => (
    <EntiEditor
      key={enti.id}
      enti={enti}
      isActive={activeTabId === enti.id}
      onSave={handleSaveEnti}
      onClose={() => handleCloseEditor(enti.id)}
    />
  ));

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
           openEntiIds={openedEntiIds}
           onCreateEnti={handleCreateEnti} 
           onSelectEnti={handleSelectEnti}
           onDeleteEnti={handleDeleteEnti}
           grupos={grupos}
           onCreateGrupo={handleCreateGrupo}
        />
        <WorkbenchRegion 
           editorStubs={editorStubs}
           activeEntis={activeEntis}
           activeTabId={activeTabId}
           onSelectTab={handleSelectTab}
           onCloseTab={handleCloseRequest}
        />
      </div>

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
