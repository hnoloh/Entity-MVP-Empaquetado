import type { 
  LocalFileOperationRequest, 
  LocalFileWorkspaceDescriptor, 
  LocalFileOperationResult,
  LocalFileReadResult,
  LocalFileWriteResult,
  LocalFileListResult,
  LocalFileDeleteResult,
  LocalFileCreateDirectoryResult
} from './localFileToolTypes';
import { localFileWorkspacePolicy } from './localFileWorkspacePolicy';
import { createAuditEntry, logLocalFileOperation } from './localFileAudit';

export interface LocalFileSystemAdapter {
  list(basePath: string, relativePath: string): Promise<LocalFileListResult>;
  read(basePath: string, relativePath: string): Promise<LocalFileReadResult>;
  write(basePath: string, relativePath: string, content: string | Uint8Array, overwrite: boolean): Promise<LocalFileWriteResult>;
  delete(basePath: string, relativePath: string): Promise<LocalFileDeleteResult>;
  createDirectory(basePath: string, relativePath: string): Promise<LocalFileCreateDirectoryResult>;
  getSize(basePath: string, relativePath: string): Promise<number>;
}

export async function localFileToolExecutor(
  request: LocalFileOperationRequest,
  descriptor: LocalFileWorkspaceDescriptor,
  adapter: LocalFileSystemAdapter,
  isToolAuthorized: boolean
): Promise<LocalFileOperationResult> {
  if (!isToolAuthorized) {
    const entry = createAuditEntry(request.entiId, request.operation, request.relativePath, 'blocked', 'tool_not_authorized');
    logLocalFileOperation(entry);
    return { success: false, blocked: true, reason: 'tool_not_authorized' };
  }

  let fileSize = 0;
  if (['read', 'write', 'overwrite'].includes(request.operation)) {
    if (request.operation === 'write' || request.operation === 'overwrite') {
      fileSize = request.content ? (typeof request.content === 'string' ? new Blob([request.content]).size : request.content.length) : 0;
    } else {
      try {
        fileSize = await adapter.getSize(descriptor.basePath, request.relativePath);
      } catch {
        // If file doesn't exist, size is 0
        fileSize = 0;
      }
    }
  }

  const policyResult = localFileWorkspacePolicy(request, descriptor, fileSize);
  if (!policyResult.allowed) {
    const entry = createAuditEntry(request.entiId, request.operation, request.relativePath, 'blocked', policyResult.reason);
    logLocalFileOperation(entry);
    return { success: false, blocked: true, reason: policyResult.reason || 'blocked_by_policy' };
  }

  try {
    let resultData;
    switch (request.operation) {
      case 'list':
        resultData = await adapter.list(descriptor.basePath, request.relativePath);
        break;
      case 'read':
        resultData = await adapter.read(descriptor.basePath, request.relativePath);
        break;
      case 'write':
        resultData = await adapter.write(descriptor.basePath, request.relativePath, request.content || '', false);
        break;
      case 'overwrite':
        resultData = await adapter.write(descriptor.basePath, request.relativePath, request.content || '', true);
        break;
      case 'delete':
        resultData = await adapter.delete(descriptor.basePath, request.relativePath);
        break;
      case 'create_directory':
        resultData = await adapter.createDirectory(descriptor.basePath, request.relativePath);
        break;
      default:
        throw new Error('invalid_operation');
    }

    const entry = createAuditEntry(request.entiId, request.operation, request.relativePath, 'allowed');
    logLocalFileOperation(entry);
    return { success: true, data: resultData };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknown_error';
    const entry = createAuditEntry(request.entiId, request.operation, request.relativePath, 'error', errorMessage);
    logLocalFileOperation(entry);
    return { error: 'controlled_error', message: errorMessage };
  }
}
