import type { AttachmentContextContent, AttachmentReadError } from '../../attachments';

export interface GroupRuntimeAttachmentContextError {
  attachmentId?: string;
  ownerType?: string;
  ownerId?: string;
  chatId?: string;
  status: 'blocked' | 'controlled_error';
  reason?: string;
  errorCode?: AttachmentReadError;
}

export interface GroupRuntimeAttachmentContextItem {
  attachmentId: string;
  ownerType: 'group';
  ownerId: string;
  chatId: string;
  status: 'success';
  contentText?: string;
  content?: AttachmentContextContent;
}

export interface GroupRuntimeAttachmentContext {
  ownerType: 'group';
  ownerId: string;
  chatId: string;
  items: GroupRuntimeAttachmentContextItem[];
  errors?: GroupRuntimeAttachmentContextError[];
  status: 'success' | 'blocked' | 'controlled_error';
}
