import React from 'react';
import { useEntiHarnessAttachmentDrop } from './useEntiHarnessAttachmentDrop';
import type { HarnessDestinationScope } from './buildHarnessAttachmentDropIntent';
import './EntiHarnessAttachmentDropZone.css';

interface Props {
  ownerId: string;
  scope: HarnessDestinationScope;
  children: React.ReactNode;
  onSuccess?: (fileNames: string[]) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const EntiHarnessAttachmentDropZone: React.FC<Props> = ({ ownerId, scope, children, onSuccess, className, style }) => {
  const { zoneRef, dropState, errorMessage, handlers } = useEntiHarnessAttachmentDrop(ownerId, scope, onSuccess);

  let overlayContent = null;
  if (dropState === 'dragging_valid') overlayContent = <div className="harness-drop-overlay valid" />;
  if (dropState === 'dragging_blocked') overlayContent = <div className="harness-drop-overlay blocked" />;
  if (dropState === 'dropped') overlayContent = (
    <div className="harness-drop-overlay success">
      <div className="spinner-dashed"></div>
    </div>
  );
  if (dropState === 'error') overlayContent = (
    <div className="harness-drop-overlay error" onClick={handlers.onDismissError} style={{ cursor: 'pointer' }}>
      {errorMessage && <div className="harness-drop-error-text">{errorMessage}</div>}
    </div>
  );

  return (
    <div 
      ref={zoneRef}
      className={`enti-harness-drop-zone-container ${className || ''}`}
      style={{ position: 'relative', width: '100%', ...style }}
      onDragEnterCapture={handlers.onDragEnter}
      onDragOverCapture={handlers.onDragOver}
      onDragLeaveCapture={handlers.onDragLeave}
      onDropCapture={handlers.onDrop}
      data-testid={`drop-zone-${scope}`}
    >
      {children}
      {overlayContent}
    </div>
  );
};
