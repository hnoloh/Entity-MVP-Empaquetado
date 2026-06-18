export type ContextualSourceScope = 'chat_context' | 'enti_knowledge' | 'enti_work_material';

export interface ContextualSourceDescriptor {
  attachmentId: string;
  ownerType: 'enti';
  ownerId: string;
  chatId?: string;
  scope: ContextualSourceScope;
  metadata?: Record<string, unknown>;
}

export interface ResolveContextualSourcesResult {
  status: 'success' | 'blocked' | 'controlled_error';
  sources?: ContextualSourceDescriptor[];
  reason?: string;
}
