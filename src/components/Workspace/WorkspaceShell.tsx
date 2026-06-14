import { useState } from "react";
import type { WorkspaceState } from "../../types/WorkspaceState";
import WorkbenchRegion from "./WorkbenchRegion";
import { HubRegion } from "./HubRegion";
import { entiRepository } from "../../domain/enti/entiRepository";
import type { Enti } from "../../domain/enti/Enti";
import { EntiEditor } from "./EntiEditor";
import "./WorkspaceShell.css";

export default function WorkspaceShell() {
  const [state, setState] = useState<WorkspaceState>("visible");
  const [entis, setEntis] = useState<Enti[]>(() => entiRepository.list());
  // Multi-editor state
  const [openedEntiIds, setOpenedEntiIds] = useState<string[]>([]);
  const [maximizedEntiIds, setMaximizedEntiIds] = useState<string[]>([]);
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
    setMaximizedEntiIds(prev => {
      const next = [...prev];
      if (!next.includes(id)) next.push(id);
      if (next.length > 1) next.shift();
      return next;
    });
    setFocusedEntiId(id);
  };

  const handleSelectEnti = (id: string) => {
    setOpenedEntiIds(prev => {
      if (!prev.includes(id)) return [...prev, id];
      return prev;
    });
    setMaximizedEntiIds(prev => {
      const next = prev.filter(mId => mId !== id);
      next.push(id);
      if (next.length > 1) next.shift();
      return next;
    });
    setFocusedEntiId(id);
  };

  const handleMinimizeEditor = (id: string) => {
    setMaximizedEntiIds(prev => prev.filter(mId => mId !== id));
  };

  const handleRestoreEditor = (id: string) => {
    setMaximizedEntiIds(prev => {
      const next = prev.filter(mId => mId !== id);
      next.push(id);
      if (next.length > 1) next.shift();
      return next;
    });
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
    setOpenedEntiIds(prev => prev.filter(openId => openId !== id));
    setMaximizedEntiIds(prev => prev.filter(mId => mId !== id));
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

  const activeEntis = openedEntiIds.map(id => {
    return unsavedEntis[id] || entiRepository.getById(id);
  }).filter((e): e is Enti => e !== undefined);

  const editorStubs = activeEntis.map(enti => (
    <EntiEditor
      key={enti.id}
      enti={enti}
      isMinimized={!maximizedEntiIds.includes(enti.id)}
      onMinimize={() => handleMinimizeEditor(enti.id)}
      onRestore={() => handleRestoreEditor(enti.id)}
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
        />
        <WorkbenchRegion 
           editorStubs={editorStubs}
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
