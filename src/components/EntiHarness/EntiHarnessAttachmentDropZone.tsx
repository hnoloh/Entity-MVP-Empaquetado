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
  const { dropState, handlers } = useEntiHarnessAttachmentDrop(ownerId, scope, onSuccess);

  let overlayContent = null;
  if (dropState === 'dragging_valid') overlayContent = <div className="harness-drop-overlay valid" />;
  if (dropState === 'dragging_blocked') overlayContent = <div className="harness-drop-overlay blocked" />;
  if (dropState === 'dropped') overlayContent = (
    <div className="harness-drop-overlay success">
      <div className="spinner-dashed"></div>
    </div>
  );
  if (dropState === 'error') overlayContent = <div className="harness-drop-overlay error" />;

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
