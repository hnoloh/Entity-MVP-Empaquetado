import { MAX_TEXT_FILE_SIZE_BYTES } from './attachmentPhysicalReadPolicy';

export function attachmentContentPersistencePolicy(
  record: unknown
): { status: 'valid' } | { status: 'blocked'; reason: string } {
  if (!record || typeof record !== 'object') {
    return { status: 'blocked', reason: 'Record is not an object' };
  }

  const r = record as Record<string, unknown>;

  if (!r.attachmentId || typeof r.attachmentId !== 'string') return { status: 'blocked', reason: 'Missing or invalid attachmentId' };
  if (r.ownerType !== 'enti' && r.ownerType !== 'group') return { status: 'blocked', reason: 'Invalid ownerType' };
  if (!r.ownerId || typeof r.ownerId !== 'string') return { status: 'blocked', reason: 'Missing or invalid ownerId' };
  if (!r.scope || typeof r.scope !== 'string') return { status: 'blocked', reason: 'Missing or invalid scope' };
  if (!r.contentText || typeof r.contentText !== 'string') return { status: 'blocked', reason: 'Missing or invalid contentText' };

  if (r.scope === 'enti_chat' || r.scope === 'group_chat') {
    if (!r.chatId || typeof r.chatId !== 'string') return { status: 'blocked', reason: 'chatId is required for chat scopes' };
  } else if (r.scope === 'enti_knowledge' || r.scope === 'enti_work_material') {
    if (r.chatId !== undefined) return { status: 'blocked', reason: 'chatId must not be present for non-chat scopes' };
  } else {
    return { status: 'blocked', reason: 'Unknown scope' };
  }

  if (r.scope === 'enti_chat' && r.ownerType !== 'enti') return { status: 'blocked', reason: 'ownerType must be enti for enti_chat' };
  if (r.scope === 'group_chat' && r.ownerType !== 'group') return { status: 'blocked', reason: 'ownerType must be group for group_chat' };
  if ((r.scope === 'enti_knowledge' || r.scope === 'enti_work_material') && r.ownerType !== 'enti') return { status: 'blocked', reason: `ownerType must be enti for ${r.scope}` };

  const bufferSize = new Blob([r.contentText]).size;
  if (bufferSize > MAX_TEXT_FILE_SIZE_BYTES) {
    return { status: 'blocked', reason: 'contentText exceeds size limit' };
  }

  const forbiddenKeys = ['file', 'blob', 'arrayBuffer', 'path', 'rawFile', 'binary'];
  const keys = Object.keys(r);
  for (const key of forbiddenKeys) {
    if (keys.includes(key)) {
      return { status: 'blocked', reason: `Forbidden key ${key} is present` };
    }
  }

  return { status: 'valid' };
}
