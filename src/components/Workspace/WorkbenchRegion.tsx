import type { ReactNode } from "react";
import GhostRegion from "./GhostRegion";
import "./WorkbenchRegion.css";

interface WorkbenchRegionProps {
  editorStubs?: ReactNode[];
  activeTabs?: { id: string; name: string }[];
  activeTabId?: string | null;
  onSelectTab?: (id: string) => void;
  onCloseTab?: (id: string) => void;
}

export default function WorkbenchRegion({ 
  editorStubs, 
  activeTabs = [], 
  activeTabId = null, 
  onSelectTab, 
  onCloseTab 
}: WorkbenchRegionProps) {
  return (
    <div data-testid="workbench-region" className="workbench-region">
      {activeTabs.length > 0 && (
        <div className="tab-bar" data-testid="tab-bar">
          {activeTabs.map(tab => (
            <div 
              key={tab.id} 
              className={`tab-item ${activeTabId === tab.id ? 'active' : ''}`}
              onClick={() => onSelectTab && onSelectTab(tab.id)}
              data-testid={`tab-item-${tab.id}`}
            >
              <span className="tab-title">{tab.name || "Sin nombre"}</span>
              <button 
                className="tab-close" 
                onClick={(e) => { e.stopPropagation(); if (onCloseTab) onCloseTab(tab.id); }}
                data-testid={`tab-close-${tab.id}`}
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
