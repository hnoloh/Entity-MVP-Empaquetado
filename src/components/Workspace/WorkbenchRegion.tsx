import type { ReactNode } from "react";
import GhostRegion from "./GhostRegion";
import type { Enti } from "../../domain/enti/Enti";
import "./WorkbenchRegion.css";

interface WorkbenchRegionProps {
  editorStubs?: ReactNode[];
  activeEntis?: Enti[];
  activeTabId?: string | null;
  onSelectTab?: (id: string) => void;
  onCloseTab?: (id: string) => void;
}

export default function WorkbenchRegion({ 
  editorStubs, 
  activeEntis = [], 
  activeTabId = null, 
  onSelectTab, 
  onCloseTab 
}: WorkbenchRegionProps) {
  return (
    <div data-testid="workbench-region" className="workbench-region">
      {activeEntis.length > 0 && (
        <div className="tab-bar" data-testid="tab-bar">
          {activeEntis.map(enti => (
            <div 
              key={enti.id} 
              className={`tab-item ${activeTabId === enti.id ? 'active' : ''}`}
              onClick={() => onSelectTab && onSelectTab(enti.id)}
              data-testid={`tab-item-${enti.id}`}
            >
              <span className="tab-title">{enti.name || "Sin nombre"}</span>
              <button 
                className="tab-close" 
                onClick={(e) => { e.stopPropagation(); if (onCloseTab) onCloseTab(enti.id); }}
                data-testid={`tab-close-${enti.id}`}
                title="Cerrar pestaña"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      <GhostRegion />

      {editorStubs && editorStubs.length > 0 ? (
        <div data-testid="editor-host-region" className="editor-host-region">
          {editorStubs}
        </div>
      ) : (
        <div
          data-testid="workbench-empty-state"
          className="workbench-empty-state"
        >
        </div>
      )}
    </div>
  );
}
