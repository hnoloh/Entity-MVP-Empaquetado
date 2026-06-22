import React from 'react';
import { useEntiHarnessAttachmentDrop } from './useEntiHarnessAttachmentDrop';
import type { HarnessDestinationScope } from './buildHarnessAttachmentDropIntent';
import './EntiHarnessAttachmentDropZone.css';

interface Props {
  ownerId: string;
  scope: HarnessDestinationScope;
  children: React.ReactNode;
  onSuccess?: (fileNames: string[]) => void;
}

export const EntiHarnessAttachmentDropZone: React.FC<Props> = ({ ownerId, scope, children, onSuccess }) => {
  const { dropState, errorMessage, handlers } = useEntiHarnessAttachmentDrop(ownerId, scope, onSuccess);

  let overlayContent = null;
  if (dropState === 'dragging_valid') overlayContent = <div className="harness-drop-overlay valid" />;
  if (dropState === 'dragging_blocked') overlayContent = <div className="harness-drop-overlay blocked" />;
  if (dropState === 'dropped') overlayContent = (
    <div className="harness-drop-overlay success">
      <div className="spinner-dashed"></div>
    </div>
  );
  if (dropState === 'error') overlayContent = (
    <div className="harness-drop-overlay error">
      {errorMessage && <div className="harness-drop-error-text">{errorMessage}</div>}
    </div>
  );

  return (
    <div 
      className="enti-harness-drop-zone-container"
      style={{ position: 'relative', width: '100%', height: '100%' }}
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
