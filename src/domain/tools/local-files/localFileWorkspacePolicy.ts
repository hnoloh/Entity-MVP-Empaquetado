import type { LocalFileOperationRequest, LocalFileOperationPolicyResult, LocalFileWorkspaceDescriptor } from './localFileToolTypes';
import { validateToolOwnership } from '../toolPolicy';

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.json', '.csv', '.xml', '.yaml', '.yml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function localFileWorkspacePolicy(
  request: LocalFileOperationRequest,
  _descriptor: LocalFileWorkspaceDescriptor,
  fileSize?: number
): LocalFileOperationPolicyResult {
  const ownerType = request.entiId === 'group' ? 'group' : 'enti';
  const ownership = validateToolOwnership(ownerType, request.entiId);
  if (!ownership.success) {
    return { allowed: false, reason: ownership.reason === 'group_owner_not_allowed' ? 'owner_group_not_allowed' : 'invalid_owner' };
  }

  // Prevent path traversal
  if (request.relativePath.includes('..')) {
    return { allowed: false, reason: 'path_traversal' };
  }

  // Prevent absolute paths
  if (request.relativePath.startsWith('/') || request.relativePath.includes(':\\')) {
    return { allowed: false, reason: 'absolute_path_not_allowed' };
  }

  // Check extension for read/write/overwrite
  if (['read', 'write', 'overwrite'].includes(request.operation)) {
    const ext = request.relativePath.slice((Math.max(0, request.relativePath.lastIndexOf(".")) || Infinity));
    if (!ALLOWED_EXTENSIONS.includes(ext.toLowerCase())) {
        return { allowed: false, reason: 'extension_not_allowed' };
    }
  }

  if (fileSize !== undefined && fileSize > MAX_FILE_SIZE) {
    return { allowed: false, reason: 'size_exceeded' };
  }

  // Check confirmation
  if (['overwrite', 'delete'].includes(request.operation) && !request.confirmationToken) {
    return { allowed: false, reason: 'confirmation_required' };
  }

  return { allowed: true };
}
