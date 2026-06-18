import type { 
  AttachmentContentRepositoryEntry, 
  AttachmentContentRepositoryKey,
  AttachmentContentRepositoryScope,
  AttachmentContentRepositoryResult,
  AttachmentContentRepositorySnapshot
} from './attachmentContentRepositoryTypes';
import { attachmentContentRepositoryPolicy } from './attachmentContentRepositoryPolicy';

class AttachmentContentRepository {
  private store = new Map<string, AttachmentContentRepositoryEntry>();

  private buildKeyString(key: AttachmentContentRepositoryKey): string {
    return `${key.attachmentId}:${key.ownerType}:${key.ownerId}:${key.chatId || ''}:${key.scope}`;
  }

  upsert(entry: AttachmentContentRepositoryEntry): AttachmentContentRepositoryResult {
    const policyResult = attachmentContentRepositoryPolicy(entry);
    if (policyResult.status !== 'valid') {
      return policyResult;
    }

    try {
      // Create a clean copy to prevent reference leakage
      const cleanEntry: AttachmentContentRepositoryEntry = {
        attachmentId: entry.attachmentId,
        ownerType: entry.ownerType,
        ownerId: entry.ownerId,
        scope: entry.scope,
        contentText: entry.contentText,
        readAt: entry.readAt
      };
      
      if (entry.chatId) cleanEntry.chatId = entry.chatId;
      if (entry.metadata) cleanEntry.metadata = JSON.parse(JSON.stringify(entry.metadata)); // Deep copy metadata safely

      this.store.set(this.buildKeyString(cleanEntry), cleanEntry);
      
      return { status: 'success', entry: cleanEntry };
    } catch {
      return { status: 'controlled_error', reason: 'Error upserting entry' };
    }
  }

  get(key: AttachmentContentRepositoryKey): AttachmentContentRepositoryResult {
    const policyResult = attachmentContentRepositoryPolicy(key);
    if (policyResult.status !== 'valid') {
      return policyResult;
    }

    const entry = this.store.get(this.buildKeyString(key));
    if (!entry) {
      return { status: 'success', entryFound: false };
    }

    return { status: 'success', entry };
  }

  listByScope(
    ownerType: 'enti' | 'group', 
    ownerId: string, 
    scope: AttachmentContentRepositoryScope, 
    chatId?: string
  ): AttachmentContentRepositoryResult {
    const policyResult = attachmentContentRepositoryPolicy({
      attachmentId: 'dummy-list', // bypass id check for partial list
      ownerType,
      ownerId,
      scope,
      chatId
    });
    
    // allow 'Missing attachmentId' as we are just listing, but other blocks are real
    if (policyResult.status !== 'valid' && policyResult.reason !== 'Missing attachmentId') {
      return policyResult;
    }

    const results = Array.from(this.store.values()).filter(entry => 
      entry.ownerType === ownerType &&
      entry.ownerId === ownerId &&
      entry.scope === scope &&
      entry.chatId === chatId
    );

    return { status: 'success', entries: results };
  }

  listByOwner(ownerType: 'enti' | 'group', ownerId: string): AttachmentContentRepositoryResult {
    if (!ownerType || !['enti', 'group'].includes(ownerType)) {
      return { status: 'blocked', reason: 'Invalid ownerType' };
    }
    if (!ownerId) {
      return { status: 'blocked', reason: 'Missing ownerId' };
    }

    const results = Array.from(this.store.values()).filter(entry => 
      entry.ownerType === ownerType &&
      entry.ownerId === ownerId
    );

    return { status: 'success', entries: results };
  }

  remove(key: AttachmentContentRepositoryKey): AttachmentContentRepositoryResult {
    const policyResult = attachmentContentRepositoryPolicy(key);
    if (policyResult.status !== 'valid') {
      return policyResult;
    }

    const keyStr = this.buildKeyString(key);
    const existed = this.store.has(keyStr);
    this.store.delete(keyStr);

    return { status: 'success', entryFound: existed };
  }

  clear(): void {
    this.store.clear();
  }

  snapshot(): AttachmentContentRepositorySnapshot {
    return {
      entries: Array.from(this.store.values()).map(entry => {
        const copy = { ...entry };
        if (copy.metadata) {
          copy.metadata = JSON.parse(JSON.stringify(copy.metadata));
        }
        return copy;
      })
    };
  }
}

export const attachmentContentRepository = new AttachmentContentRepository();
