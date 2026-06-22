/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ContextualSourceDescriptor } from './contextualSourceTypes';
import type { AttachmentPhysicalReadResult, AttachmentPhysicalReadError } from './attachmentPhysicalContentTypes';
import { attachmentPhysicalReadPolicy } from './attachmentPhysicalReadPolicy';

export async function readAttachmentPhysicalTextContent(
  descriptor: ContextualSourceDescriptor,
  fileRef?: File | Blob
): Promise<AttachmentPhysicalReadResult> {
  const policyResult = attachmentPhysicalReadPolicy(descriptor, fileRef?.size);

  if ((policyResult as any).status !== 'valid') {
    return policyResult as AttachmentPhysicalReadError;
  }

  if (!fileRef) {
    return {
      attachmentId: descriptor.attachmentId,
      ownerType: descriptor.ownerType,
      ownerId: descriptor.ownerId,
      chatId: descriptor.chatId,
      scope: descriptor.scope,
      readStatus: 'blocked',
      errorCode: 'file_unavailable',
      errorMessage: 'No File or Blob reference provided for reading'
    };
  }

  try {
    const rawText = await fileRef.text();
    const contentText = rawText.trim();

    if (!contentText) {
      return {
        attachmentId: descriptor.attachmentId,
        ownerType: descriptor.ownerType,
        ownerId: descriptor.ownerId,
        chatId: descriptor.chatId,
        scope: descriptor.scope,
        readStatus: 'blocked',
        errorCode: 'empty_content',
        errorMessage: 'The file is empty or contains only whitespace'
      };
    }

    return {
      attachmentId: descriptor.attachmentId,
      ownerType: descriptor.ownerType,
      ownerId: descriptor.ownerId,
      chatId: descriptor.chatId,
      scope: descriptor.scope!,
      fileName: descriptor.fileName || '',
      fileExtension: descriptor.fileExtension || '',
      mimeType: descriptor.mimeType || '',
      contentText,
      readStatus: 'success'
    } as any;
  } catch (error) {
    return {
      attachmentId: descriptor.attachmentId,
      ownerType: descriptor.ownerType,
      ownerId: descriptor.ownerId,
      chatId: descriptor.chatId,
      scope: descriptor.scope,
      readStatus: 'controlled_error',
      errorCode: 'read_failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error during physical read'
    };
  }
}
