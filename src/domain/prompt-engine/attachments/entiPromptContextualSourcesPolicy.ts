
export interface EntiPromptContextualSourceValidationRequest {
  attachmentId: string;
  ownerType: string;
  ownerId?: string;
  chatId?: string;
  scope: string; // Changed to string to accommodate both ContextualSourceScope and AttachmentContentRepositoryScope
  contentText?: string;
}

export function entiPromptContextualSourcesPolicy(
  req: EntiPromptContextualSourceValidationRequest
): { status: 'valid' } | { status: 'blocked'; reason: string } {
  if (req.ownerType !== 'enti') {
    return { status: 'blocked', reason: 'ownerType must be enti' };
  }

  if (!req.ownerId) {
    return { status: 'blocked', reason: 'ownerId is required' };
  }

  if (!req.attachmentId) {
    return { status: 'blocked', reason: 'attachmentId is required' };
  }

  const validScopes = ['enti_chat', 'enti_knowledge', 'enti_work_material'];
  if (!validScopes.includes(req.scope)) {
    return { status: 'blocked', reason: `Invalid scope: ${req.scope}` };
  }

  if (req.scope === 'enti_chat' && !req.chatId) {
    return { status: 'blocked', reason: 'chatId is required for enti_chat scope' };
  }

  // Not strictly enforcing no chatId for knowledge/work material here if it's already validated by repo policy,
  // but let's be strict just in case.
  if ((req.scope === 'enti_knowledge' || req.scope === 'enti_work_material') && req.chatId) {
    return { status: 'blocked', reason: `chatId is not allowed for ${req.scope} scope in base sources` };
  }

  if (req.contentText === undefined || req.contentText === null) {
    return { status: 'blocked', reason: 'contentText is required' };
  }

  if (typeof req.contentText !== 'string') {
    return { status: 'blocked', reason: 'contentText must be a string' };
  }

  if (req.contentText.length > 500000) { // arbitrary safe limit
    return { status: 'blocked', reason: 'contentText exceeds maximum safe size for prompt injection' };
  }

  return { status: 'valid' };
}
