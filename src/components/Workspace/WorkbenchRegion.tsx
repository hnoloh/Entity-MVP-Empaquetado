import type { ReactNode } from 'react';
import './WorkbenchRegion.css';

interface WorkbenchRegionProps {
  editorStub?: ReactNode;
}

export default function WorkbenchRegion({ editorStub }: WorkbenchRegionProps) {
  return (
    <div data-testid="workbench-region" className="workbench-region">
      {editorStub ? (
        <div data-testid="editor-host-region" className="editor-host-region">
          {editorStub}
        </div>
      ) : (
        <div data-testid="workbench-empty-state" className="workbench-empty-state">
        </div>
      )}
    </div>
  );
}
