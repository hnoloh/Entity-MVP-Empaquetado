import type { AttachmentContentRepositoryScope } from './attachmentContentRepositoryTypes';

export interface AttachmentContentPersistenceRecord {
  attachmentId: string;
  ownerType: 'enti' | 'group';
  ownerId: string;
  chatId?: string;
  scope: AttachmentContentRepositoryScope;
  contentText: string;
  metadata?: Record<string, unknown>;
  readAt: string;
}

export type AttachmentContentPersistenceResult =
  | { status: 'success'; records: AttachmentContentPersistenceRecord[] }
  | { status: 'blocked'; reason: string }
  | { status: 'controlled_error'; reason: string };
