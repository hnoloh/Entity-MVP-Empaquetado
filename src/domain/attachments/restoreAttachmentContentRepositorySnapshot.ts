import type { AttachmentContentPersistenceRecord } from './attachmentContentPersistenceTypes';
import { attachmentContentPersistencePolicy } from './attachmentContentPersistencePolicy';
import { attachmentContentRepository } from './attachmentContentRepository';
import type { AttachmentContentRepositoryEntry } from './attachmentContentRepositoryTypes';

export function restoreAttachmentContentRepositorySnapshot(
  records: unknown[]
): { status: 'success'; restoredCount: number; errors: number } | { status: 'controlled_error'; reason: string } {
  if (!Array.isArray(records)) {
    return { status: 'controlled_error', reason: 'Input must be an array of records' };
  }

  let restoredCount = 0;
  let errors = 0;

  for (const record of records) {
    const policyCheck = attachmentContentPersistencePolicy(record);
    if (policyCheck.status === 'valid') {
      const validRecord = record as AttachmentContentPersistenceRecord;
      
      const entry: AttachmentContentRepositoryEntry = {
        attachmentId: validRecord.attachmentId,
        ownerType: validRecord.ownerType,
        ownerId: validRecord.ownerId,
        scope: validRecord.scope,
        contentText: validRecord.contentText,
        readAt: validRecord.readAt || new Date().toISOString()
      };
      
      if (validRecord.chatId) entry.chatId = validRecord.chatId;
      if (validRecord.metadata) {
        try {
          entry.metadata = JSON.parse(JSON.stringify(validRecord.metadata));
        } catch {
          // ignore
        }
      }

      const upsertResult = attachmentContentRepository.upsert(entry);
      if (upsertResult.status === 'success') {
        restoredCount++;
      } else {
        errors++;
      }
    } else {
      errors++;
    }
  }

  return { status: 'success', restoredCount, errors };
}
