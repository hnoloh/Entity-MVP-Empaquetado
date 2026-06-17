import { useState, useCallback } from 'react';
import { createAttachmentModelFlow } from '../../domain/attachments/createAttachmentModelFlow';
import { associateAttachmentToEntiKnowledgeFlow } from '../../domain/attachments/associateAttachmentToEntiKnowledgeFlow';
import { associateAttachmentToEntiWorkMaterialFlow } from '../../domain/attachments/associateAttachmentToEntiWorkMaterialFlow';
import { buildHarnessAttachmentDropIntent } from './buildHarnessAttachmentDropIntent';
import type { HarnessDestinationScope } from './buildHarnessAttachmentDropIntent';

export type HarnessAttachmentDropState = 'idle' | 'dragging_valid' | 'dragging_blocked' | 'dropped' | 'error';

export function useEntiHarnessAttachmentDrop(ownerId: string, scope: HarnessDestinationScope, onSuccess?: (fileNames: string[]) => void) {
  const [dropState, setDropState] = useState<HarnessAttachmentDropState>('idle');

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
    
    // Simulate domain operations strictly following the domain rules
    let hasError = false;
    const processedFiles: string[] = [];
    for (const file of intent.files) {
       const parts = file.name.split('.');
       const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';

       const creationResult = createAttachmentModelFlow({
         explicitUserAction: true,
         ownerType: 'enti',
         ownerId: ownerId,
         chatId: 'harness_global',
         fileName: file.name,
         fileExtension: extension as any,
         mimeType: file.type,
         sizeBytes: file.size
       });

       if (creationResult.status !== 'success' || !creationResult.attachment) {
         hasError = true;
         continue;
       }
       
       const model = creationResult.attachment;

       if (scope === 'enti_knowledge') {
          const result = associateAttachmentToEntiKnowledgeFlow({ attachment: model, ownerId, ownerType: 'enti' });
          if (result.status !== 'success') hasError = true;
       } else {
          const result = associateAttachmentToEntiWorkMaterialFlow({ attachment: model, ownerId, ownerType: 'enti' });
          if (result.status !== 'success') hasError = true;
       }
       
       if (!hasError) {
         processedFiles.push(file.name);
       }
    }

    if (hasError) {
      setDropState('error');
    } else {
      if (onSuccess && processedFiles.length > 0) {
        onSuccess(processedFiles);
      }
    }
    setTimeout(() => setDropState('idle'), 2000);
  }, [ownerId, scope, onSuccess]);

  return {
    dropState,
    handlers: { onDragEnter, onDragOver, onDragLeave, onDrop }
  };
}
