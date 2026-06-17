import type { ReadAttachmentAsContextResult } from '../../attachments';
import type { EntiRuntimeAttachmentBlock } from './entiRuntimeAttachmentContextTypes';

export function buildEntiAttachmentRuntimeContext(
  attachmentId: string,
  readResult: ReadAttachmentAsContextResult
): EntiRuntimeAttachmentBlock {
  if (readResult.status === 'success') {
    return {
      attachmentId,
      status: 'success',
      content: readResult.content
    };
  } else if (readResult.status === 'blocked') {
    return {
      attachmentId,
      status: 'blocked',
      reason: readResult.reason
    };
  } else {
    return {
      attachmentId,
      status: 'controlled_error',
      reason: readResult.reason,
      errorType: readResult.error
    };
  }
}
