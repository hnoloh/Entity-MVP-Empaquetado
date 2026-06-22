import { useState, useCallback } from 'react';
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

export function useEntiHarnessAttachmentDrop(ownerId: string, scope: HarnessDestinationScope, onSuccess?: (fileNames: string[]) => void) {
  const [dropState, setDropState] = useState<HarnessAttachmentDropState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const intent = buildHarnessAttachmentDropIntent(e.dataTransfer, scope, 'enti');
    setDropState(intent.status === 'valid' ? 'dragging_valid' : 'dragging_blocked');
  }, [scope]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropState === 'idle') {
      const intent = buildHarnessAttachmentDropIntent(e.dataTransfer, scope, 'enti');
      setDropState(intent.status === 'valid' ? 'dragging_valid' : 'dragging_blocked');
    }
  }, [dropState, scope]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Simplified: si el mouse deja la zona
    setDropState('idle');
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const intent = buildHarnessAttachmentDropIntent(e.dataTransfer, scope, 'enti');
    if (intent.status === 'blocked' || intent.files.length === 0) {
      setDropState('error');
      setTimeout(() => setDropState('idle'), 2000);
      return;
    }

    setDropState('dropped');
    setErrorMessage(null);
    
    // Simulate domain operations strictly following the domain rules
    let hasError = false;
    const processedFiles: string[] = [];
    for (const file of intent.files) {
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
         setErrorMessage('Para adjuntar archivos de conocimiento o material de trabajo de este tipo, debes activar la Tool: ' + toolNotice.toolId);
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
           entiId: ownerId,
           ownerType: 'enti',
           ownerId: ownerId,
           fileName: file.name,
           mimeType: file.type,
           fileExtension: extension,
           sizeBytes: file.size,
           fileRef: file
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
           attachmentId: model.attachmentId,
           ownerType: model.ownerType as 'enti' | 'group',
           ownerId: model.ownerId,
           scope: scope,
           fileName: model.fileName,
           fileExtension: model.fileExtension,
           mimeType: model.mimeType
         }, file);

         if (readResult.readStatus !== 'success') {
           hasError = true;
           continue;
         }
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
           attachmentId: model.attachmentId,
           ownerType: model.ownerType as 'enti',
           ownerId: model.ownerId,
           scope: scope as 'enti_knowledge' | 'enti_work_material',
           contentText: extractedText,
           readAt: new Date().toISOString(),
           metadata: { fileName: model.fileName }
         });
         processedFiles.push(file.name);
       }
    }

    if (hasError) {
      setDropState('error');
      setTimeout(() => setDropState('idle'), 2000);
    } else {
      if (onSuccess && processedFiles.length > 0) {
        onSuccess(processedFiles);
      }
      setTimeout(() => setDropState('idle'), 2000);
    }
  }, [ownerId, scope, onSuccess]);

  return {
    dropState,
    errorMessage,
    handlers: { onDragEnter, onDragOver, onDragLeave, onDrop }
  };
}
