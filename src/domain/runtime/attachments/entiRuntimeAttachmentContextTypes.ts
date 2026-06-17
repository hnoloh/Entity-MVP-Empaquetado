import type { AttachmentContextContent, AttachmentReadError } from '../../attachments';

export interface EntiRuntimeAttachmentBlock {
  attachmentId: string;
  status: 'success' | 'blocked' | 'controlled_error';
  content?: AttachmentContextContent;
  reason?: string;
  errorType?: AttachmentReadError;
}

export interface EntiRuntimeAttachmentContext {
  ownerType: 'enti';
  ownerId: string;
  chatId: string;
  blocks: EntiRuntimeAttachmentBlock[];
}
