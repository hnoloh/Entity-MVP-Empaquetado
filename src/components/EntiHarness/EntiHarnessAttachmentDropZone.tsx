import React from 'react';
import { useEntiHarnessAttachmentDrop } from './useEntiHarnessAttachmentDrop';
import type { HarnessDestinationScope } from './buildHarnessAttachmentDropIntent';
import './EntiHarnessAttachmentDropZone.css';

interface Props {
  ownerId: string;
  scope: HarnessDestinationScope;
  children: React.ReactNode;
}

export const EntiHarnessAttachmentDropZone: React.FC<Props> = ({ ownerId, scope, children }) => {
  const { dropState, handlers } = useEntiHarnessAttachmentDrop(ownerId, scope);

  let overlayContent = null;
  if (dropState === 'dragging_valid') overlayContent = <div className="harness-drop-overlay valid">Soltar archivo aquí</div>;
  if (dropState === 'dragging_blocked') overlayContent = <div className="harness-drop-overlay blocked">Archivo no soportado</div>;
  if (dropState === 'dropped') overlayContent = <div className="harness-drop-overlay success">¡Archivo asociado!</div>;
  if (dropState === 'error') overlayContent = <div className="harness-drop-overlay error">Error al procesar</div>;

  return (
    <div 
      className="enti-harness-drop-zone-container"
      style={{ position: 'relative', width: '100%', height: '100%' }}
      {...handlers}
      data-testid={`drop-zone-${scope}`}
    >
      {children}
      {overlayContent}
    </div>
  );
};
