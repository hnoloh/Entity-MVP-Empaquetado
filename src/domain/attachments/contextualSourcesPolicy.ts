import type { ContextualSourceScope } from './contextualSourceTypes';

export interface ContextualSourcesPolicyRequest {
  ownerType: string;
  scope: string;
  blob?: unknown;
  content?: unknown;
  rawText?: unknown;
  snapshot?: unknown;
}

export interface ContextualSourcesPolicyResult {
  status: 'success' | 'blocked' | 'controlled_error';
  reason?: string;
}

export function contextualSourcesPolicy(request: ContextualSourcesPolicyRequest): ContextualSourcesPolicyResult {
  if (request.ownerType !== 'enti') {
    return { status: 'blocked', reason: 'ownerType must be enti' };
  }

  const validScopes: ContextualSourceScope[] = ['chat_context', 'enti_knowledge', 'enti_work_material'];
  if (!validScopes.includes(request.scope as ContextualSourceScope)) {
    return { status: 'blocked', reason: 'Invalid scope' };
  }

  if (request.blob !== undefined || request.content !== undefined || request.rawText !== undefined || request.snapshot !== undefined) {
    return { status: 'blocked', reason: 'Contextual source descriptor cannot contain blob, content, rawText or snapshot fields' };
  }

  return { status: 'success' };
}
