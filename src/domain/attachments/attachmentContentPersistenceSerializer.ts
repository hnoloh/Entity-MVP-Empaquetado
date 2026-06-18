import type { AttachmentContentRepositorySnapshot } from './attachmentContentRepositoryTypes';
import type { AttachmentContentPersistenceRecord } from './attachmentContentPersistenceTypes';
import { attachmentContentPersistencePolicy } from './attachmentContentPersistencePolicy';

export function serializeAttachmentContentRepositorySnapshot(
  snapshot: AttachmentContentRepositorySnapshot
): AttachmentContentPersistenceRecord[] {
  const records: AttachmentContentPersistenceRecord[] = [];

  for (const entry of snapshot.entries) {
    // Only copy allowed fields to ensure JSON safety
    const record: AttachmentContentPersistenceRecord = {
      attachmentId: entry.attachmentId,
      ownerType: entry.ownerType,
      ownerId: entry.ownerId,
      scope: entry.scope,
      contentText: entry.contentText,
      readAt: entry.readAt
    };

    if (entry.chatId) record.chatId = entry.chatId;
    
    // Deep clone metadata if present, dropping functions/undefined
    if (entry.metadata) {
      try {
        record.metadata = JSON.parse(JSON.stringify(entry.metadata));
      } catch {
        // Drop metadata if not JSON serializable
      }
    }

    const policyCheck = attachmentContentPersistencePolicy(record);
    if (policyCheck.status === 'valid') {
      records.push(record);
    }
  }

  return records;
}
