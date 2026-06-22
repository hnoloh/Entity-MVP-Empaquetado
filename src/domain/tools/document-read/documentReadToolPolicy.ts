import type { DocumentReadToolInput, DocumentReadBlockedReason } from './documentReadToolTypes';
import { toolAuthorizationRepository } from '../toolAuthorizationRepository';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export function documentReadToolPolicy(input: DocumentReadToolInput): { status: 'valid' } | { status: 'blocked', reason: DocumentReadBlockedReason } {
  // 1. Tool authorization
  const auths = toolAuthorizationRepository.list();
  const isAuthorized = auths.some(a => a.entiId === input.entiId && a.toolId === 'tool-read-doc' && a.state === 'authorized');
  
  if (!isAuthorized) {
    return { status: 'blocked', reason: 'tool_not_active' };
  }

  // 2. Owner validation
  if (input.ownerType === 'group') {
    // Owner groups are not allowed to use tools directly as owner.
    // The sequence logic should extract the entiId and use it.
    // If the input explicitly says ownerType group for a tool execution, it's blocked.
    // Wait! A document dropped in a group chat has ownerType='group'.
    // The tool execution uses the first sequence Enti.
    // The policy receives the original document owner info.
    // But we are passing the `entiId` that is executing.
    // So group ownership of the document is fine, as long as it's targeted to a specific entiId.
  }

  if (!input.ownerId || !input.entiId) {
    return { status: 'blocked', reason: 'invalid_owner' };
  }

  // 3. Format validation
  const ext = input.fileExtension.toLowerCase();
  if (ext !== 'pdf' && ext !== 'docx') {
    return { status: 'blocked', reason: 'invalid_format' };
  }

  // 4. Size validation
  if (input.sizeBytes && input.sizeBytes > MAX_FILE_SIZE_BYTES) {
    return { status: 'blocked', reason: 'file_too_large' };
  }

  return { status: 'valid' };
}
