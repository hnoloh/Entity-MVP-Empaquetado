import type { Attachment } from './attachmentModel';
import type { AttachmentContentPersistenceRecord } from './attachmentContentPersistenceTypes';
import { attachmentContentRepository } from './attachmentContentRepository';
import { serializeAttachmentContentRepositorySnapshot } from './attachmentContentPersistenceSerializer';
import { restoreAttachmentContentRepositorySnapshot } from './restoreAttachmentContentRepositorySnapshot';

export interface AttachmentPersistenceRecord {
  attachmentId: string;
  ownerType: 'enti' | 'group';
  ownerId: string;
  chatId: string;
  fileName?: string;
  fileExtension?: string;
  mimeType?: string;
  sizeBytes?: number;
  receivedAt?: string;
  status?: string;
  source?: string;
}

export interface AttachmentPersistencePayload {
  records: AttachmentPersistenceRecord[];
  contentRecords?: AttachmentContentPersistenceRecord[];
}

export type AttachmentPersistenceResult =
  | { status: 'success'; payload: AttachmentPersistencePayload }
  | { status: 'blocked'; reason: string }
  | { status: 'controlled_error'; reason: string };

export type RestoreAttachmentPersistenceResult =
  | { status: 'success'; attachments: Attachment[] }
  | { status: 'blocked'; reason: string }
  | { status: 'controlled_error'; reason: string };

export function persistAttachmentRecordsFlow(
  attachments: Attachment[]
): AttachmentPersistenceResult {
  const records: AttachmentPersistenceRecord[] = [];

  for (const att of attachments) {
    if (!att.attachmentId) {
      return { status: 'blocked', reason: 'Missing attachmentId' };
    }
    if (att.ownerType !== 'enti' && att.ownerType !== 'group') {
      return { status: 'blocked', reason: 'Invalid ownerType' };
    }
    if (!att.ownerId) {
      return { status: 'blocked', reason: 'Missing ownerId' };
    }
    if (!att.chatId) {
      return { status: 'blocked', reason: 'Missing chatId' };
    }

    // Check for forbidden fields
    const forbiddenFields = ['content', 'blob', 'file', 'arrayBuffer', 'text', 'absolutePath', 'localPath'];
    const keys = Object.keys(att);
    for (const key of forbiddenFields) {
      if (keys.includes(key)) {
         return { status: 'blocked', reason: `Forbidden field ${key} is not allowed` };
      }
    }

    const record: AttachmentPersistenceRecord = {
      attachmentId: att.attachmentId,
      ownerType: att.ownerType as 'enti' | 'group',
      ownerId: att.ownerId,
      chatId: att.chatId,
    };

    if (att.fileName) record.fileName = att.fileName;
    if (att.fileExtension) record.fileExtension = att.fileExtension;
    if (att.mimeType) record.mimeType = att.mimeType;
    if (att.sizeBytes) record.sizeBytes = att.sizeBytes;
    if (att.receivedAt) record.receivedAt = att.receivedAt;
    if (att.status) record.status = att.status;
    if (att.source) record.source = att.source;

    records.push(record);
  }

  const contentRecords = serializeAttachmentContentRepositorySnapshot(attachmentContentRepository.snapshot());

  return {
    status: 'success',
    payload: { records, contentRecords }
  };
}

export function restoreAttachmentRecordsFlow(
  payload: AttachmentPersistencePayload | Record<string, unknown>
): RestoreAttachmentPersistenceResult {
  if (!payload || !Array.isArray(payload.records)) {
    return { status: 'controlled_error', reason: 'Invalid payload format' };
  }

  const attachments: Attachment[] = [];

  for (const record of payload.records) {
    if (!record.attachmentId) {
      return { status: 'blocked', reason: 'Missing attachmentId' };
    }
    if (record.ownerType !== 'enti' && record.ownerType !== 'group') {
      return { status: 'blocked', reason: 'Invalid ownerType' };
    }
    if (!record.ownerId) {
      return { status: 'blocked', reason: 'Missing ownerId' };
    }
    if (!record.chatId) {
      return { status: 'blocked', reason: 'Missing chatId' };
    }

    const attachment = {
      attachmentId: record.attachmentId,
      ownerType: record.ownerType,
      ownerId: record.ownerId,
      chatId: record.chatId,
    } as Attachment;

    if (record.fileName) attachment.fileName = record.fileName;
    if (record.fileExtension) attachment.fileExtension = record.fileExtension;
    if (record.mimeType) attachment.mimeType = record.mimeType;
    if (record.sizeBytes) attachment.sizeBytes = record.sizeBytes;
    if (record.receivedAt) attachment.receivedAt = record.receivedAt;
    if (record.status) attachment.status = record.status;
    if (record.source) attachment.source = record.source;

    attachments.push(attachment);
  }

  if (payload.contentRecords && Array.isArray(payload.contentRecords)) {
    restoreAttachmentContentRepositorySnapshot(payload.contentRecords);
  }

  return {
    status: 'success',
    attachments
  };
}
