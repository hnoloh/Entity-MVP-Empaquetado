import type { ReadAttachmentAsContextResult } from '../../attachments';
import type { GroupRuntimeAttachmentContextItem, GroupRuntimeAttachmentContextError } from './groupRuntimeAttachmentContextTypes';

export function buildGroupAttachmentRuntimeContext(
  attachmentId: string,
  ownerId: string,
  chatId: string,
  readResult: ReadAttachmentAsContextResult
): { item?: GroupRuntimeAttachmentContextItem; error?: GroupRuntimeAttachmentContextError } {
  if (readResult.status === 'success') {
    return {
      item: {
        attachmentId,
        ownerType: 'group',
        ownerId,
        chatId,
        status: 'success',
        contentText: readResult.content.contentText,
        content: readResult.content
      }
    };
  } else if (readResult.status === 'blocked') {
    return {
      error: {
        attachmentId,
        ownerType: 'group',
        ownerId,
        chatId,
        status: 'blocked',
        reason: readResult.reason
      }
    };
  } else {
    return {
      error: {
        attachmentId,
        ownerType: 'group',
        ownerId,
        chatId,
        status: 'controlled_error',
        reason: readResult.reason,
        errorCode: readResult.error
      }
    };
  }
}
