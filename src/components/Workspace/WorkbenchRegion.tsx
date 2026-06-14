import type { ReactNode } from "react";
import GhostRegion from "./GhostRegion";
import "./WorkbenchRegion.css";

interface WorkbenchRegionProps {
  editorStubs?: ReactNode[];
}

export default function WorkbenchRegion({ editorStubs }: WorkbenchRegionProps) {
  return (
    <div data-testid="workbench-region" className="workbench-region">
      <GhostRegion />
      
      {editorStubs && editorStubs.length > 0 ? (
        <div data-testid="editor-host-region" className="editor-host-region">
          {editorStubs}
        </div>
      ) : (
        <div
          data-testid="workbench-empty-state"
          className="workbench-empty-state"
        ></div>
      )}
    </div>
  );
}
