export type Attachment = {
  attachmentId: string;
  ownerType: 'enti' | 'group';
  ownerId: string;
  chatId: string;
  fileName: string;
  fileExtension: 'pdf' | 'docx' | 'odt' | 'md' | 'json' | 'txt';
  mimeType?: string;
  sizeBytes?: number;
  receivedAt: string;
  status: 'received' | 'readable' | 'unsupported' | 'error';
  source: 'user_upload';
};

export const SUPPORTED_ATTACHMENT_EXTENSIONS = ['pdf', 'docx', 'odt', 'md', 'json', 'txt'] as const;
export type SupportedAttachmentExtension = typeof SUPPORTED_ATTACHMENT_EXTENSIONS[number];

export function isSupportedAttachmentType(extension: string): extension is SupportedAttachmentExtension {
  return SUPPORTED_ATTACHMENT_EXTENSIONS.includes(extension as SupportedAttachmentExtension);
}

export interface AttachmentModelRequest {
  explicitUserAction: boolean;
  ownerType: 'enti' | 'group';
  ownerId: string;
  chatId: string;
  fileName: string;
  fileExtension: string;
  mimeType?: string;
  sizeBytes?: number;
  receivedAt?: string;
  attachmentId?: string;
}

export interface AttachmentModelResult {
  status: 'success' | 'blocked' | 'controlled_error';
  attachment?: Attachment;
  reason?: string;
}
