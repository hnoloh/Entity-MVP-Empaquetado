export interface AttachmentContextContent {
  attachmentId: string;
  ownerType: 'enti' | 'group';
  ownerId: string;
  chatId: string;
  sourceName: string;
  contentText: string;
  metadata?: any;
}

export type AttachmentReadError = 
  | 'wrong_owner' 
  | 'wrong_chat' 
  | 'unsupported_type' 
  | 'unavailable_file' 
  | 'empty_content' 
  | 'size_limit_exceeded' 
  | 'not_found';
