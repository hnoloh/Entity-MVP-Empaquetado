import { useState, useCallback, useEffect, useRef } from 'react';
import { createAttachmentModelFlow } from '../../domain/attachments/createAttachmentModelFlow';
import { associateAttachmentToEntiKnowledgeFlow } from '../../domain/attachments/associateAttachmentToEntiKnowledgeFlow';
import { associateAttachmentToEntiWorkMaterialFlow } from '../../domain/attachments/associateAttachmentToEntiWorkMaterialFlow';
import { buildHarnessAttachmentDropIntent } from './buildHarnessAttachmentDropIntent';
import type { HarnessDestinationScope } from './buildHarnessAttachmentDropIntent';
import { readAttachmentPhysicalTextContent } from '../../domain/attachments/readAttachmentPhysicalTextContent';
import { attachmentContentRepository } from '../../domain/attachments/attachmentContentRepository';
import { generateToolRequiredNoticeForDocument } from '../../domain/tools/toolRequiredNotice';
import { toolAuthorizationRepository } from '../../domain/tools/toolAuthorizationRepository';
import { toolIndicatorRepository } from '../../domain/tools/toolIndicatorRepository';
import { documentReadToolExecutor } from '../../domain/tools/document-read';

export type HarnessAttachmentDropState = 'idle' | 'dragging_valid' | 'dragging_blocked' | 'dropped' | 'error';

const isTauriActive = () => typeof window !== 'undefined' && ((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ || (window as unknown as { __TAURI__?: unknown }).__TAURI__);
let lastDropTimestamp = 0;

export function useEntiHarnessAttachmentDrop(ownerId: string, scope: HarnessDestinationScope, onSuccess?: (fileNames: string[]) => void) {
  const [dropState, setDropState] = useState<HarnessAttachmentDropState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Reusable drop logic
  const processFiles = useCallback(async (files: File[]) => {
    let hasError = false;
    const processedFiles: string[] = [];
    for (const file of files) {
       const parts = file.name.split('.');
       const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';

       const toolNotice = generateToolRequiredNoticeForDocument(
         file.name,
         file.type,
         'harness_enti',
         ownerId,
         toolAuthorizationRepository.list()
       );

       if (toolNotice) {
         toolIndicatorRepository.setIndicator(ownerId, toolNotice.toolId, 'required_not_active');
         hasError = true;
         setErrorMessage('Para adjuntar archivos de este tipo como conocimiento o material de trabajo, debes activar la Tool: ' + toolNotice.toolId);
         continue; 
       }

       const creationResult = createAttachmentModelFlow({
         explicitUserAction: true,
         ownerType: 'enti',
         ownerId: ownerId,
         chatId: 'harness_global',
         fileName: file.name,
         fileExtension: extension as "md" | "txt" | "pdf" | "jpg" | "jpeg" | "png" | "gif",
         mimeType: file.type,
         sizeBytes: file.size
       });

       if (creationResult.status !== 'success' || !creationResult.attachment) {
         hasError = true;
         continue;
       }
       
       const model = creationResult.attachment;
       let extractedText: string;
       const isDoc = extension === 'pdf' || extension === 'docx';

       if (isDoc) {
         toolIndicatorRepository.setIndicator(ownerId, 'tool-read-doc', 'in_use');
         const execResult = await documentReadToolExecutor({
           entiId: ownerId, ownerType: 'enti', ownerId: ownerId,
           fileName: file.name, mimeType: file.type, fileExtension: extension,
           sizeBytes: file.size, fileRef: file
         });

         if (execResult.status !== 'success') {
           hasError = true;
           toolIndicatorRepository.setIndicator(ownerId, 'tool-read-doc', 'controlled_error');
           setErrorMessage(execResult.errorMessage || execResult.blockedReason || 'Error de lectura documental');
           continue;
         }
         toolIndicatorRepository.setIndicator(ownerId, 'tool-read-doc', 'active');
         extractedText = execResult.content!.rawText;
       } else {
         const readResult = await readAttachmentPhysicalTextContent({
           attachmentId: model.attachmentId, ownerType: model.ownerType as 'enti' | 'group', ownerId: model.ownerId,
           scope: scope, fileName: model.fileName, fileExtension: model.fileExtension, mimeType: model.mimeType
         }, file);

         if (readResult.readStatus !== 'success') { hasError = true; continue; }
         extractedText = readResult.contentText!;
       }

       if (scope === 'enti_knowledge') {
          const result = associateAttachmentToEntiKnowledgeFlow({ attachment: model, ownerId, ownerType: 'enti' });
          if (result.status !== 'success') hasError = true;
       } else {
          const result = associateAttachmentToEntiWorkMaterialFlow({ attachment: model, ownerId, ownerType: 'enti' });
          if (result.status !== 'success') hasError = true;
       }
       
       if (!hasError) {
         attachmentContentRepository.upsert({
           attachmentId: model.attachmentId, ownerType: model.ownerType as 'enti', ownerId: model.ownerId,
           scope: scope as 'enti_knowledge' | 'enti_work_material', contentText: extractedText,
           readAt: new Date().toISOString(), metadata: { fileName: model.fileName }
         });
         processedFiles.push(file.name);
       }
    }

    if (hasError) {
      setDropState('error');
    } else {
      if (onSuccessRef.current && processedFiles.length > 0) onSuccessRef.current(processedFiles);
      setTimeout(() => setDropState('idle'), 2000);
    }
  }, [ownerId, scope]);

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
                
                // Deduplicate paths in case the OS sends duplicates
                const uniquePaths = Array.from(new Set(paths));
                
                // Debounce double-firing from WebKitGTK
                const now = Date.now();
                if (lastDropTimestamp && now - lastDropTimestamp < 1000) {
                   console.log("Ignored duplicate drop event within 1s");
                   return;
                }
                lastDropTimestamp = now;
                
                setDropState('dropped');
                setErrorMessage(null);
                
                const finalFiles: File[] = [];
                for (const path of uniquePaths) {
                  try {
                    const bytes = await readFile(path);
                    const filename = path.split('/').pop() || path.split('\\').pop() || 'document.docx';
                    let mime = 'application/octet-stream';
                    if (filename.endsWith('.pdf')) mime = 'application/pdf';
                    else if (filename.endsWith('.docx')) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    else if (filename.endsWith('.txt')) mime = 'text/plain';
                    finalFiles.push(new File([bytes], filename, { type: mime }));
                  } catch (e) {
                    console.error("Tauri native read fail", e);
                  }
                }
                
                await processFiles(finalFiles);
             }
          } else if (event.payload.type === 'cancel' || event.payload.type === 'leave') {
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
  }, [scope, processFiles]);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isTauriActive()) return; // Let native handle
    const intent = buildHarnessAttachmentDropIntent(e.dataTransfer, scope, 'enti');
    setDropState(intent.status === 'valid' ? 'dragging_valid' : 'dragging_blocked');
  }, [scope]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isTauriActive()) return;
    if (dropState === 'idle') {
      const intent = buildHarnessAttachmentDropIntent(e.dataTransfer, scope, 'enti');
      setDropState(intent.status === 'valid' ? 'dragging_valid' : 'dragging_blocked');
    }
  }, [dropState, scope]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isTauriActive()) return;
    setDropState('idle');
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isTauriActive()) return;
    
    const intent = buildHarnessAttachmentDropIntent(e.dataTransfer, scope, 'enti');
    if (intent.status === 'blocked' || intent.files.length === 0) {
      setDropState('error');
      return;
    }

    setDropState('dropped');
    setErrorMessage(null);
    await processFiles(intent.files);
  }, [scope, processFiles]);

  const onDismissError = useCallback(() => {
    if (dropState === 'error') setDropState('idle');
  }, [dropState]);

  return {
    zoneRef,
    dropState,
    errorMessage,
    handlers: { onDragEnter, onDragOver, onDragLeave, onDrop, onDismissError }
  };
}
