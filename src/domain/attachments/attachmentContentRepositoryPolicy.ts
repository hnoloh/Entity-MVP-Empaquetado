import type { AttachmentContentRepositoryEntry, AttachmentContentRepositoryKey } from './attachmentContentRepositoryTypes';
import { MAX_TEXT_FILE_SIZE_BYTES } from './attachmentPhysicalReadPolicy';

export function attachmentContentRepositoryPolicy(
  entryOrKey: Partial<AttachmentContentRepositoryEntry> | AttachmentContentRepositoryKey
): { status: 'valid' } | { status: 'blocked'; reason: string } {
  
  if (!entryOrKey.attachmentId) {
    return { status: 'blocked', reason: 'Missing attachmentId' };
  }
  if (!entryOrKey.ownerType || !['enti', 'group'].includes(entryOrKey.ownerType)) {
    return { status: 'blocked', reason: 'Invalid or missing ownerType' };
  }
  if (!entryOrKey.ownerId) {
    return { status: 'blocked', reason: 'Missing ownerId' };
  }
  if (!entryOrKey.scope) {
    return { status: 'blocked', reason: 'Missing scope' };
  }

  // Validate scope vs ownerType and chatId
  if (entryOrKey.scope === 'enti_chat') {
    if (entryOrKey.ownerType !== 'enti') return { status: 'blocked', reason: 'Scope enti_chat requires ownerType enti' };
    if (!entryOrKey.chatId) return { status: 'blocked', reason: 'Scope enti_chat requires chatId' };
  } else if (entryOrKey.scope === 'group_chat') {
    if (entryOrKey.ownerType !== 'group') return { status: 'blocked', reason: 'Scope group_chat requires ownerType group' };
    if (!entryOrKey.chatId) return { status: 'blocked', reason: 'Scope group_chat requires chatId' };
  } else if (entryOrKey.scope === 'enti_knowledge' || entryOrKey.scope === 'enti_work_material') {
    if (entryOrKey.ownerType !== 'enti') return { status: 'blocked', reason: `Scope ${entryOrKey.scope} requires ownerType enti` };
    if (entryOrKey.chatId) return { status: 'blocked', reason: `Scope ${entryOrKey.scope} must not have chatId` };
  } else {
    return { status: 'blocked', reason: 'Unknown scope' };
  }

  // If it's an entry (not just a key), validate content
  if ('contentText' in entryOrKey) {
    const entry = entryOrKey as AttachmentContentRepositoryEntry;
    
    if (typeof entry.contentText !== 'string') {
      return { status: 'blocked', reason: 'contentText must be a string' };
    }
    
    const bufferSize = new Blob([entry.contentText]).size;
    if (bufferSize > MAX_TEXT_FILE_SIZE_BYTES) {
      return { status: 'blocked', reason: `contentText exceeds limit of ${MAX_TEXT_FILE_SIZE_BYTES} bytes` };
    }

    // Check for forbidden objects
    if ('file' in entry || 'blob' in entry || 'arrayBuffer' in entry || 'fileReader' in entry) {
      return { status: 'blocked', reason: 'Forbidden objects in entry (file, blob, etc)' };
    }
  }

  return { status: 'valid' };
}
