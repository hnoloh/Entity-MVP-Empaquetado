export type ContextualSourceScope = 'chat_context' | 'enti_knowledge' | 'enti_work_material';

export interface ContextualSourceDescriptor {
  attachmentId: string;
  ownerType: 'enti' | 'group';
  ownerId: string;
  chatId?: string;
  scope: ContextualSourceScope;
  fileName?: string;
  fileExtension?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

export interface ResolveContextualSourcesResult {
  status: 'success' | 'blocked' | 'controlled_error';
  sources?: ContextualSourceDescriptor[];
  reason?: string;
}
