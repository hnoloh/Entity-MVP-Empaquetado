import { useState } from 'react';
import type { WorkspaceState } from '../../types/WorkspaceState';
import WorkbenchRegion from './WorkbenchRegion';
import { HubRegion } from './HubRegion';
import GhostRegion from './GhostRegion';
import './WorkspaceShell.css';

export default function WorkspaceShell() {
  const [state, setState] = useState<WorkspaceState>('visible');

  const handleToggleState = () => {
    setState(prev => {
      if (prev === 'visible') return 'minimizado';
      if (prev === 'minimizado') return 'restaurado';
      return 'visible';
    });
  };

  return (
    <div data-testid="workspace-shell" data-state={state} className={`workspace-shell state-${state}`}>
      {/* Top Bar Placeholder - Anteriormente malinterpretado como HubRegion */}
      <div className="top-bar-placeholder" style={{ height: '40px', flexShrink: 0 }}></div>
      
      <div className="workspace-content">
        <HubRegion />
        <WorkbenchRegion />
      </div>
      
      <GhostRegion />
      
      {/* Botón temporal de prueba para cambiar estado */}
      <button data-testid="toggle-state-btn" onClick={handleToggleState} style={{display: 'none'}}>Toggle</button>
    </div>
  );
}
