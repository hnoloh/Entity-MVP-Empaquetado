export type AttachmentPhysicalTextContent = {
  attachmentId: string;
  ownerType: 'enti' | 'group';
  ownerId: string;
  chatId?: string;
  scope: import('./contextualSourceTypes').ContextualSourceScope;
  fileName: string;
  fileExtension?: string;
  mimeType?: string;
  contentText: string;
  readStatus: 'success';
};

export type AttachmentPhysicalReadError = {
  attachmentId?: string;
  ownerType?: 'enti' | 'group';
  ownerId?: string;
  chatId?: string;
  scope?: import('./contextualSourceTypes').ContextualSourceScope;
  readStatus: 'blocked' | 'controlled_error';
  errorCode:
    | 'missing_attachment'
    | 'missing_owner'
    | 'missing_scope'
    | 'unsupported_type'
    | 'file_unavailable'
    | 'empty_content'
    | 'size_limit_exceeded'
    | 'read_failed'
    | 'forbidden_context';
  errorMessage?: string;
};

export type AttachmentPhysicalReadResult = AttachmentPhysicalTextContent | AttachmentPhysicalReadError;
