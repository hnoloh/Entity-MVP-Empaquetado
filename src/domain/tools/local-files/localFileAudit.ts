import type { LocalFileOperationAuditEntry, LocalFileOperation } from './localFileToolTypes';

export function createAuditEntry(
  entiId: string,
  operation: LocalFileOperation,
  relativePath: string,
  status: 'allowed' | 'blocked' | 'error',
  reason?: string
): LocalFileOperationAuditEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    entiId,
    operation,
    relativePath,
    status,
    reason
  };
}

export const localFileAuditLog: LocalFileOperationAuditEntry[] = [];

export function logLocalFileOperation(entry: LocalFileOperationAuditEntry): void {
  localFileAuditLog.push(entry);
}

export function getLocalFileAuditLog(): LocalFileOperationAuditEntry[] {
  return [...localFileAuditLog];
}

export function clearLocalFileAuditLog(): void {
  localFileAuditLog.length = 0;
}
