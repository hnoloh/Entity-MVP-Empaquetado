export type DocumentReadBlockedReason =
  | 'tool_not_active'
  | 'invalid_format'
  | 'invalid_owner'
  | 'file_too_large';

export type DocumentReadControlledError =
  | 'file_corrupt'
  | 'file_protected'
  | 'file_empty'
  | 'parser_unavailable'
  | 'unknown_read_error';

export interface DocumentReadToolInput {
  entiId: string;
  ownerType: 'enti' | 'group';
  ownerId: string;
  fileName: string;
  mimeType: string;
  fileExtension: string;
  sizeBytes?: number;
  fileRef: File | Blob;
}

export interface DocumentReadExtractedContent {
  rawText: string;
  normalizedText: string;
  pageCount?: number;
  wordCount?: number;
}

export interface DocumentReadToolResult {
  status: 'success' | 'blocked' | 'controlled_error';
  content?: DocumentReadExtractedContent;
  blockedReason?: DocumentReadBlockedReason;
  errorReason?: DocumentReadControlledError;
  errorMessage?: string;
}
