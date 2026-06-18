export type AttachmentContentRepositoryScope = 'enti_chat' | 'group_chat' | 'enti_knowledge' | 'enti_work_material';

export interface AttachmentContentRepositoryKey {
  attachmentId: string;
  ownerType: 'enti' | 'group';
  ownerId: string;
  chatId?: string;
  scope: AttachmentContentRepositoryScope;
}

export interface AttachmentContentRepositoryEntry {
  attachmentId: string;
  ownerType: 'enti' | 'group';
  ownerId: string;
  chatId?: string;
  scope: AttachmentContentRepositoryScope;
  contentText: string;
  metadata?: Record<string, unknown>;
  readAt: string;
}

export type AttachmentContentRepositoryResult = 
  | { status: 'success'; entry: AttachmentContentRepositoryEntry }
  | { status: 'success'; entries: AttachmentContentRepositoryEntry[] }
  | { status: 'success'; entryFound: boolean }
  | { status: 'blocked'; reason: string }
  | { status: 'controlled_error'; reason: string };

export interface AttachmentContentRepositorySnapshot {
  entries: AttachmentContentRepositoryEntry[];
}
