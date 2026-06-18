import type { ContextualSourceDescriptor } from './contextualSourceTypes';
import type { AttachmentPhysicalReadError } from './attachmentPhysicalContentTypes';

export const MAX_TEXT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const SUPPORTED_TEXT_EXTENSIONS = ['txt', 'md', 'json', 'csv', 'yml', 'yaml', 'xml', 'html', 'css', 'js', 'ts'];
export const SUPPORTED_TEXT_MIME_PREFIXES = ['text/', 'application/json', 'application/xml'];

export function attachmentPhysicalReadPolicy(
  descriptor: ContextualSourceDescriptor,
  fileSize?: number
): { status: 'valid' } | AttachmentPhysicalReadError {
  if (!descriptor) {
    return {
      readStatus: 'blocked',
      errorCode: 'missing_attachment',
      errorMessage: 'No descriptor provided for physical read'
    };
  }

  if (!descriptor.ownerType || !descriptor.ownerId) {
    return {
      attachmentId: descriptor.attachmentId,
      readStatus: 'blocked',
      errorCode: 'missing_owner',
      errorMessage: 'Missing owner tracing information'
    };
  }

  if (!descriptor.scope) {
    return {
      attachmentId: descriptor.attachmentId,
      ownerType: descriptor.ownerType,
      ownerId: descriptor.ownerId,
      chatId: descriptor.chatId,
      readStatus: 'blocked',
      errorCode: 'missing_scope',
      errorMessage: 'Missing scope information'
    };
  }

  // Validate extension or mime type
  const hasValidExtension = descriptor.fileExtension && SUPPORTED_TEXT_EXTENSIONS.includes(descriptor.fileExtension.toLowerCase());
  const hasValidMime = descriptor.mimeType && SUPPORTED_TEXT_MIME_PREFIXES.some(prefix => descriptor.mimeType!.startsWith(prefix));

  if (!hasValidExtension && !hasValidMime) {
    return {
      attachmentId: descriptor.attachmentId,
      ownerType: descriptor.ownerType,
      ownerId: descriptor.ownerId,
      chatId: descriptor.chatId,
      scope: descriptor.scope,
      readStatus: 'blocked',
      errorCode: 'unsupported_type',
      errorMessage: 'Unsupported file type for textual read'
    };
  }

  if (fileSize !== undefined && fileSize > MAX_TEXT_FILE_SIZE_BYTES) {
    return {
      attachmentId: descriptor.attachmentId,
      ownerType: descriptor.ownerType,
      ownerId: descriptor.ownerId,
      chatId: descriptor.chatId,
      scope: descriptor.scope,
      readStatus: 'blocked',
      errorCode: 'size_limit_exceeded',
      errorMessage: `File size exceeds the textual read limit of ${MAX_TEXT_FILE_SIZE_BYTES} bytes`
    };
  }

  return { status: 'valid' };
}
