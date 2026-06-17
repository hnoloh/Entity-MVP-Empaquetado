import type { Attachment } from './attachmentModel';

export interface AssociateAttachmentToGroupChatRequest {
  attachment: Attachment;
  ownerType: 'group' | string;
  ownerId: string;
  chatId: string;
  chatOwnerType?: string;
  chatOwnerId?: string;
}

export interface AttachmentGroupChatAssociation {
  associationId: string;
  attachmentId: string;
  ownerType: 'group';
  ownerId: string;
  chatId: string;
  status: 'attached' | 'accepted' | 'valid';
}

export type AssociateAttachmentToGroupChatResult =
  | { status: 'success'; association: AttachmentGroupChatAssociation }
  | { status: 'blocked'; reason: string }
  | { status: 'controlled_error'; reason: string };

export function associateAttachmentToGroupChatFlow(
  request: AssociateAttachmentToGroupChatRequest
): AssociateAttachmentToGroupChatResult {
  if (!request.attachment || !request.attachment.attachmentId) {
    return {
      status: 'controlled_error',
      reason: 'Valid attachment is required'
    };
  }

  if (request.ownerType !== 'group') {
    return {
      status: 'blocked',
      reason: 'ownerType must be group'
    };
  }

  if (!request.ownerId || request.ownerId.trim() === '') {
    return {
      status: 'blocked',
      reason: 'ownerId cannot be empty'
    };
  }

  if (!request.chatId || request.chatId.trim() === '') {
    return {
      status: 'blocked',
      reason: 'chatId cannot be empty'
    };
  }

  if (request.chatOwnerId && request.chatOwnerId !== request.ownerId) {
    return {
      status: 'blocked',
      reason: 'chatId belongs to a different ownerId'
    };
  }

  if (request.chatOwnerType && request.chatOwnerType !== 'group') {
    return {
      status: 'blocked',
      reason: 'chatId belongs to an enti, not a group'
    };
  }

  if (request.attachment.ownerType !== 'group' || request.attachment.ownerId !== request.ownerId || request.attachment.chatId !== request.chatId) {
    return {
      status: 'controlled_error',
      reason: 'Attachment does not belong to this chat and owner'
    };
  }

  const association: AttachmentGroupChatAssociation = {
    associationId: crypto.randomUUID(),
    attachmentId: request.attachment.attachmentId,
    ownerType: 'group',
    ownerId: request.ownerId,
    chatId: request.chatId,
    status: 'attached'
  };

  return {
    status: 'success',
    association
  };
}
