import type { Attachment } from './attachmentModel';

export interface AssociateAttachmentToEntiChatRequest {
  explicitUserAction?: boolean;
  attachment: Attachment;
  ownerType: 'enti' | 'group' | string;
  ownerId: string;
  chatId: string;
  chatOwnerType?: string;
  chatOwnerId?: string;
}

export interface AttachmentEntiChatAssociation {
  associationId: string;
  attachmentId: string;
  ownerType: 'enti';
  ownerId: string;
  chatId: string;
  status: 'attached' | 'accepted' | 'valid';
}

export type AssociateAttachmentToEntiChatResult =
  | { status: 'success'; association: AttachmentEntiChatAssociation }
  | { status: 'blocked'; reason: string }
  | { status: 'controlled_error'; reason: string };

export function associateAttachmentToEntiChatFlow(
  request: AssociateAttachmentToEntiChatRequest
): AssociateAttachmentToEntiChatResult {
  if (request.explicitUserAction === false) {
    return {
      status: 'blocked',
      reason: 'explicitUserAction is required'
    };
  }

  if (!request.attachment || !request.attachment.attachmentId) {
    return {
      status: 'controlled_error',
      reason: 'Valid attachment is required'
    };
  }

  if (request.ownerType !== 'enti') {
    return {
      status: 'controlled_error',
      reason: 'ownerType must be enti'
    };
  }

  if (!request.ownerId || request.ownerId.trim() === '') {
    return {
      status: 'controlled_error',
      reason: 'ownerId cannot be empty'
    };
  }

  if (!request.chatId || request.chatId.trim() === '') {
    return {
      status: 'controlled_error',
      reason: 'chatId cannot be empty'
    };
  }

  if (request.chatOwnerId && request.chatOwnerId !== request.ownerId) {
    return {
      status: 'controlled_error',
      reason: 'chatId belongs to a different ownerId'
    };
  }

  if (request.chatOwnerType && request.chatOwnerType !== 'enti') {
    return {
      status: 'controlled_error',
      reason: 'chatId belongs to a group, not an enti'
    };
  }

  if (request.attachment.ownerType !== 'enti' || request.attachment.ownerId !== request.ownerId || request.attachment.chatId !== request.chatId) {
    return {
      status: 'controlled_error',
      reason: 'Attachment does not belong to this chat and owner'
    };
  }

  const association: AttachmentEntiChatAssociation = {
    associationId: crypto.randomUUID(),
    attachmentId: request.attachment.attachmentId,
    ownerType: 'enti',
    ownerId: request.ownerId,
    chatId: request.chatId,
    status: 'attached'
  };

  return {
    status: 'success',
    association
  };
}
