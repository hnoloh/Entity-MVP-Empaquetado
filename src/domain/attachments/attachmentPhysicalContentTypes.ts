export type AttachmentPhysicalTextContent = {
  attachmentId: string;
  ownerType: 'enti' | 'group';
  ownerId: string;
  chatId?: string;
  scope: 'chat' | 'enti_knowledge' | 'enti_work_material';
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
  scope?: 'chat' | 'enti_knowledge' | 'enti_work_material';
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
