import { isSupportedAttachmentType } from './attachmentModel';
import type { Attachment, AttachmentModelRequest, AttachmentModelResult } from './attachmentModel';

export function createAttachmentModelFlow(request: AttachmentModelRequest): AttachmentModelResult {
  if (!request.explicitUserAction) {
    return {
      status: 'blocked',
      reason: 'explicitUserAction is required to create an attachment'
    };
  }

  if (!request.ownerType || !['enti', 'group'].includes(request.ownerType)) {
    return {
      status: 'controlled_error',
      reason: 'Valid ownerType (enti or group) is required'
    };
  }

  if (!request.ownerId || request.ownerId.trim() === '') {
    return {
      status: 'controlled_error',
      reason: 'ownerId is required and cannot be empty'
    };
  }

  if (!request.chatId || request.chatId.trim() === '') {
    return {
      status: 'controlled_error',
      reason: 'chatId is required and cannot be empty'
    };
  }

  if (!request.fileName || request.fileName.trim() === '') {
    return {
      status: 'controlled_error',
      reason: 'fileName is required and cannot be empty'
    };
  }

  if (!isSupportedAttachmentType(request.fileExtension)) {
    return {
      status: 'controlled_error',
      reason: `Unsupported file extension: ${request.fileExtension}`
    };
  }

  const attachment: Attachment = {
    attachmentId: request.attachmentId || crypto.randomUUID(),
    ownerType: request.ownerType,
    ownerId: request.ownerId,
    chatId: request.chatId,
    fileName: request.fileName,
    fileExtension: request.fileExtension,
    mimeType: request.mimeType,
    sizeBytes: request.sizeBytes,
    receivedAt: request.receivedAt || new Date().toISOString(),
    status: 'received',
    source: 'user_upload'
  };

  return {
    status: 'success',
    attachment
  };
}
