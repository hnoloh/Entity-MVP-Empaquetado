import { useState, useCallback } from 'react';
import { buildAttachmentDropIntent } from './buildAttachmentDropIntent';
import { 
  createAttachmentModelFlow, 
  associateAttachmentToEntiChatFlow, 
  associateAttachmentToGroupChatFlow, 
  persistAttachmentRecordsFlow 
} from '../../domain/attachments';

export type AttachmentDropState = 'idle' | 'dragging_valid' | 'dragging_blocked' | 'dropped' | 'error';

export function useChatAttachmentDrop(
  ownerType: 'enti' | 'group' | undefined,
  ownerId: string | undefined,
  chatId: string | undefined
) {
  const [dropState, setDropState] = useState<AttachmentDropState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!ownerType || !ownerId || !chatId) {
      setDropState('dragging_blocked');
      return;
    }
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasFiles = Array.from(e.dataTransfer.items).some(item => item.kind === 'file');
      setDropState(hasFiles ? 'dragging_valid' : 'dragging_blocked');
    } else {
      setDropState('dragging_valid');
    }
  }, [ownerType, ownerId, chatId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropState === 'idle') {
      if (!ownerType || !ownerId || !chatId) {
        setDropState('dragging_blocked');
      } else {
        setDropState('dragging_valid');
      }
    }
  }, [dropState, ownerType, ownerId, chatId]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Prevent flickering when dragging over child elements
    const relatedTarget = e.relatedTarget as Node | null;
    if (!relatedTarget || !(e.currentTarget instanceof Node) || !e.currentTarget.contains(relatedTarget)) {
      setDropState('idle');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!ownerType || !ownerId || !chatId || (ownerType !== 'enti' && ownerType !== 'group')) {
      setDropState('idle');
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
      setDropState('idle');
      return;
    }

    setDropState('dropped');
    setErrorMessage(null);

    const file = files[0]; // Soporte a un solo archivo temporalmente o por requerimiento
    const intent = buildAttachmentDropIntent(file, ownerType as 'enti' | 'group', ownerId, chatId);
    
    const creationResult = createAttachmentModelFlow({
      explicitUserAction: true,
      ownerType: intent.ownerType,
      ownerId: intent.ownerId,
      chatId: intent.chatId,
      fileName: intent.metadata.fileName,
      fileExtension: intent.metadata.fileExtension,
      mimeType: intent.metadata.mimeType,
      sizeBytes: intent.metadata.sizeBytes,
      source: intent.metadata.source
    });

    if (creationResult.status !== 'success') {
      setDropState('error');
      setErrorMessage(creationResult.reason);
      setTimeout(() => setDropState('idle'), 3000);
      return;
    }

    const attachment = creationResult.attachment;
    let assocResult;

    if (ownerType === 'enti') {
      assocResult = associateAttachmentToEntiChatFlow({
        explicitUserAction: true,
        attachment,
        ownerType: 'enti',
        ownerId,
        chatId
      });
    } else {
      assocResult = associateAttachmentToGroupChatFlow({
        attachment,
        ownerType: 'group',
        ownerId,
        chatId
      });
    }

    if (assocResult.status !== 'success') {
      setDropState('error');
      setErrorMessage(assocResult.reason);
      setTimeout(() => setDropState('idle'), 3000);
      return;
    }

    const persistResult = persistAttachmentRecordsFlow([attachment]);
    if (persistResult.status !== 'success') {
      setDropState('error');
      setErrorMessage(persistResult.reason);
      setTimeout(() => setDropState('idle'), 3000);
      return;
    }

    setTimeout(() => setDropState('idle'), 1500);

  }, [ownerType, ownerId, chatId]);

  return {
    dropState,
    errorMessage,
    handlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    }
  };
}
