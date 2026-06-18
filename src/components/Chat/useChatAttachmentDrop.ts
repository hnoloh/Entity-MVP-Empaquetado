import { useState, useCallback } from 'react';
import { buildAttachmentDropIntent } from './buildAttachmentDropIntent';
import { 
  createAttachmentModelFlow, 
  associateAttachmentToEntiChatFlow, 
  associateAttachmentToGroupChatFlow, 
  persistAttachmentRecordsFlow 
} from '../../domain/attachments';
import { attachmentsStore } from './attachmentsStore';
import { readAttachmentPhysicalTextContent } from '../../domain/attachments/readAttachmentPhysicalTextContent';
import { attachmentContentRepository } from '../../domain/attachments/attachmentContentRepository';

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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
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
      sizeBytes: intent.metadata.sizeBytes
    });

    if (creationResult.status !== 'success' || !creationResult.attachment) {
      setDropState('error');
      setErrorMessage(creationResult.reason || 'Error desconocido');
      setTimeout(() => setDropState('idle'), 3000);
      return;
    }

    const attachment = creationResult.attachment;

    // Puente UI -> Lectura Física
    const readResult = await readAttachmentPhysicalTextContent({
      attachmentId: attachment.attachmentId,
      ownerType: attachment.ownerType as 'enti' | 'group',
      ownerId: attachment.ownerId,
      chatId: attachment.chatId,
      scope: ownerType === 'enti' ? 'enti_chat' : 'group_chat',
      fileName: attachment.fileName,
      fileExtension: attachment.fileExtension,
      mimeType: attachment.mimeType
    }, file);

    if (readResult.readStatus !== 'success') {
      setDropState('error');
      setErrorMessage(readResult.errorMessage || 'Error de lectura');
      setTimeout(() => setDropState('idle'), 3000);
      return;
    }

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
      setErrorMessage(assocResult.reason || 'Error en asociación');
      setTimeout(() => setDropState('idle'), 3000);
      return;
    }

    // Upsert to repository
    attachmentContentRepository.upsert({
      attachmentId: readResult.attachmentId,
      ownerType: readResult.ownerType,
      ownerId: readResult.ownerId,
      chatId: readResult.chatId,
      scope: readResult.scope as 'enti_chat' | 'group_chat',
      contentText: readResult.contentText!,
      readAt: new Date().toISOString(),
      metadata: { fileName: readResult.fileName }
    });

    const persistResult = persistAttachmentRecordsFlow([attachment]);
    if (persistResult.status !== 'success') {
      setDropState('error');
      setErrorMessage(persistResult.reason || 'Error de persistencia');
      setTimeout(() => setDropState('idle'), 3000);
      return;
    }

    attachmentsStore.addAttachment(attachment);

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
