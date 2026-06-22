import { describe, it, expect, beforeEach } from 'vitest';
import { createAuditEntry, logLocalFileOperation, getLocalFileAuditLog, clearLocalFileAuditLog } from '../localFileAudit';

describe('localFileAudit', () => {
  beforeEach(() => {
    clearLocalFileAuditLog();
  });

  it('creates and logs audit entry', () => {
    const entry = createAuditEntry('enti-1', 'write', 'test.txt', 'allowed');
    logLocalFileOperation(entry);
    
    const logs = getLocalFileAuditLog();
    expect(logs).toHaveLength(1);
    expect(logs[0].entiId).toBe('enti-1');
    expect(logs[0].operation).toBe('write');
    expect(logs[0].relativePath).toBe('test.txt');
    expect(logs[0].status).toBe('allowed');
  });
});
