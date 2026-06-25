/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect, useRef } from 'react';
import { buildAttachmentDropIntent } from './buildAttachmentDropIntent';

interface FileWithPath extends File {
  path?: string;
}

const isTauriActive = () => typeof window !== 'undefined' && ((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ || (window as unknown as { __TAURI__?: unknown }).__TAURI__);
let lastDropTimestamp = 0;
import { 
  createAttachmentModelFlow, 
  associateAttachmentToEntiChatFlow, 
  associateAttachmentToGroupChatFlow, 
  persistAttachmentRecordsFlow 
} from '../../domain/attachments';
import { attachmentsStore } from './attachmentsStore';
import { readAttachmentPhysicalTextContent } from '../../domain/attachments/readAttachmentPhysicalTextContent';
import { attachmentContentRepository } from '../../domain/attachments/attachmentContentRepository';
import { generateToolRequiredNoticeForDocument } from '../../domain/tools/toolRequiredNotice';
import { toolAuthorizationRepository } from '../../domain/tools/toolAuthorizationRepository';
import { toolIndicatorRepository } from '../../domain/tools/toolIndicatorRepository';
import { documentReadToolExecutor } from '../../domain/tools/document-read';

export type AttachmentDropState = 'idle' | 'dragging_valid' | 'dragging_blocked' | 'dropped' | 'error';

export function useChatAttachmentDrop(
  ownerType: 'enti' | 'group' | undefined,
  ownerId: string | undefined,
  chatId: string | undefined,
  firstSequenceEntiId?: string | undefined
) {
  const [dropState, setDropState] = useState<AttachmentDropState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTauriActive()) return;
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
    if (isTauriActive()) return;
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
    if (isTauriActive()) return;
    // Prevent flickering when dragging over child elements
    const relatedTarget = e.relatedTarget as Node | null;
    if (!relatedTarget || !(e.currentTarget instanceof Node) || !e.currentTarget.contains(relatedTarget)) {
      setDropState('idle');
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!ownerType || !ownerId || !chatId || (ownerType !== 'enti' && ownerType !== 'group')) {
      setDropState('idle');
      return;
    }

    setDropState('dropped');
    setErrorMessage(null);

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

    const toolNotice = generateToolRequiredNoticeForDocument(
      attachment.fileName || intent.metadata.fileName || file.name || '',
      (attachment.mimeType || '') as any,
      ownerType === 'enti' ? 'chat_enti' : 'group_sequence',
      (ownerType === 'enti' ? ownerId : firstSequenceEntiId) || '',
      toolAuthorizationRepository.list()
    );

    if (toolNotice) {
      toolIndicatorRepository.setIndicator(ownerType === 'enti' ? ownerId! : firstSequenceEntiId!, toolNotice.toolId, 'required_not_active');
      setDropState('error');
      setErrorMessage(toolNotice.message);
      setTimeout(() => setDropState('idle'), 4000);
      return;
    }

    let extractedText: string;

    const ext = attachment.fileExtension.toLowerCase();
    const isDoc = ext === 'pdf' || ext === 'docx';
    const activeEntiId = ownerType === 'enti' ? ownerId! : firstSequenceEntiId!;

    if (isDoc) {
      toolIndicatorRepository.setIndicator(activeEntiId, 'tool-read-doc', 'in_use');
      
      const execResult = await documentReadToolExecutor({
        entiId: activeEntiId,
        ownerType: attachment.ownerType as 'enti' | 'group',
        ownerId: attachment.ownerId,
        fileName: attachment.fileName || '',
        mimeType: (attachment.mimeType || '') as any,
        fileExtension: attachment.fileExtension || '',
        sizeBytes: file.size,
        fileRef: file
      });

      if (execResult.status !== 'success') {
        toolIndicatorRepository.setIndicator(activeEntiId, 'tool-read-doc', 'controlled_error');
        setDropState('error');
        setErrorMessage(execResult.errorMessage || execResult.blockedReason || 'Error de lectura documental');
        setTimeout(() => setDropState('idle'), 3000);
        return;
      }

      toolIndicatorRepository.setIndicator(activeEntiId, 'tool-read-doc', 'active');
      extractedText = execResult.content!.rawText;
    } else {
      // Puente UI -> Lectura Física (TXT/MD)
      const readResult = await readAttachmentPhysicalTextContent({
        attachmentId: attachment.attachmentId,
        ownerType: attachment.ownerType as any,
        ownerId: attachment.ownerId,
        chatId: attachment.chatId,
        scope: 'chat_context' as any,
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
      extractedText = readResult.contentText!;
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
      attachmentId: attachment.attachmentId,
      ownerType: attachment.ownerType as any,
      ownerId: attachment.ownerId,
      chatId: attachment.chatId,
      scope: (ownerType === 'enti' ? 'enti_chat' : 'group_chat') as any,
      contentText: extractedText,
      readAt: new Date().toISOString(),
      metadata: { fileName: attachment.fileName }
    });

    const persistResult = persistAttachmentRecordsFlow([attachment]);
    if (persistResult.status !== 'success') {
      setDropState('error');
      setErrorMessage(persistResult.reason || 'Error de persistencia');
      setTimeout(() => setDropState('idle'), 3000);
      return;
    }

    attachmentsStore.addAttachment(attachment);
    setTimeout(() => setDropState('idle'), 2000);
  }, [ownerId, ownerType, chatId, firstSequenceEntiId]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTauriActive()) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
      setDropState('idle');
      return;
    }
    await processFile(files[0]);
  }, [processFile]);

  useEffect(() => {
    if (!isTauriActive()) return;
    
    let unlistenPromise: Promise<() => void> | null = null;
    
    const setupTauriDrop = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const { readFile } = await import('@tauri-apps/plugin-fs');
        
        unlistenPromise = getCurrentWindow().onDragDropEvent(async (event) => {
          if (!zoneRef.current) return;
          
          if (event.payload.type === 'over' || event.payload.type === 'enter' || event.payload.type === 'drop') {
             const { x, y } = event.payload.position;
             const scale = window.devicePixelRatio || 1;
             const logicalX = x / scale;
             const logicalY = y / scale;
             
             const rect = zoneRef.current.getBoundingClientRect();
             const isInside = logicalX >= rect.left && logicalX <= rect.right && logicalY >= rect.top && logicalY <= rect.bottom;
             
             if (!isInside) {
                setDropState((prev) => prev !== 'idle' && prev !== 'error' && prev !== 'dropped' ? 'idle' : prev);
                return;
             }
             
             if (event.payload.type === 'over' || event.payload.type === 'enter') {
                setDropState('dragging_valid');
             } else if (event.payload.type === 'drop') {
                const payload = event.payload as { paths?: string[] };
                const paths = payload.paths;
                if (!paths || paths.length === 0) return;
                
                const uniquePaths = Array.from(new Set(paths));
                const now = Date.now();
                if (lastDropTimestamp && now - lastDropTimestamp < 1000) return;
                lastDropTimestamp = now;
                
                const path = uniquePaths[0]; // Support one file for now
                try {
                  const bytes = await readFile(path);
                  const filename = path.split('/').pop() || path.split('\\').pop() || 'document.docx';
                  let mime = 'application/octet-stream';
                  if (filename.endsWith('.pdf')) mime = 'application/pdf';
                  else if (filename.endsWith('.docx')) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                  else if (filename.endsWith('.txt')) mime = 'text/plain';
                  const fileObj = new File([bytes], filename, { type: mime }) as FileWithPath;
                  fileObj.path = path;
                  
                  await processFile(fileObj);
                } catch (e) {
                  console.error("Tauri native read fail", e);
                  setDropState('error');
                  setErrorMessage('No se pudo leer el archivo físico');
                  setTimeout(() => setDropState('idle'), 3000);
                }
             }
          } else if ((event.payload.type as string) === 'cancel' || (event.payload.type as string) === 'leave') {
             setDropState('idle');
          }
        });
      } catch (e) { console.error("Tauri API missing", e); }
    };
    setupTauriDrop();
    return () => {
      if (unlistenPromise) {
        unlistenPromise.then(unlisten => { if (unlisten) unlisten(); });
      }
    };
  }, [processFile]);

  return {
    zoneRef,
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
