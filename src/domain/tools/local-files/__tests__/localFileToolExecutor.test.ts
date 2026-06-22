/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { localFileToolExecutor, type LocalFileSystemAdapter } from '../localFileToolExecutor';
import { clearLocalFileAuditLog, getLocalFileAuditLog } from '../localFileAudit';
import type { LocalFileOperationRequest, LocalFileWorkspaceDescriptor } from '../localFileToolTypes';

describe('localFileToolExecutor', () => {
  const descriptor: LocalFileWorkspaceDescriptor = { basePath: '/allowed' };
  
  const mockAdapter: LocalFileSystemAdapter = {
    list: async () => ({ files: ['a.txt'], directories: [] }),
    read: async () => ({ content: 'hello', metadata: { size: 5, extension: '.txt' } }),
    write: async () => ({ bytesWritten: 5 }),
    delete: async () => ({ success: true }),
    createDirectory: async () => ({ success: true }),
    getSize: async () => 5
  };

  beforeEach(() => {
    clearLocalFileAuditLog();
  });

  const createRequest = (overrides: Partial<LocalFileOperationRequest>): LocalFileOperationRequest => ({
    entiId: 'enti-123',
    operation: 'read',
    relativePath: 'test.txt',
    ...overrides
  });

  it('returns blocked if tool not authorized', async () => {
    const req = createRequest({});
    const res = await localFileToolExecutor(req, descriptor, mockAdapter, false);
    expect((res as any).success).toBe(false);
    if (!(res as any).success && 'blocked' in res) {
      expect(res.reason).toBe('tool_not_authorized');
    } else {
      expect.fail('Expected blocked response');
    }
    const audit = getLocalFileAuditLog();
    expect(audit[0].status).toBe('blocked');
    expect(audit[0].reason).toBe('tool_not_authorized');
  });

  it('returns controlled error on adapter failure', async () => {
    const failingAdapter = {
      ...mockAdapter,
      read: async () => { throw new Error('not_found'); }
    };
    const req = createRequest({});
    const res = await localFileToolExecutor(req, descriptor, failingAdapter, true);
    expect((res as any).success).toBeUndefined(); // It's LocalFileControlledError
    if ('error' in res) {
      expect(res.error).toBe('controlled_error');
      expect(res.message).toBe('not_found');
    } else {
      expect.fail('Expected error response');
    }
  });

  it('allows read and audits it', async () => {
    const req = createRequest({});
    const res = await localFileToolExecutor(req, descriptor, mockAdapter, true);
    expect((res as any).success).toBe(true);
    const audit = getLocalFileAuditLog();
    expect(audit[0].status).toBe('allowed');
    expect(audit[0].operation).toBe('read');
  });

  it('blocks overwrite without confirmation', async () => {
    const req = createRequest({ operation: 'overwrite' });
    const res = await localFileToolExecutor(req, descriptor, mockAdapter, true);
    expect((res as any).success).toBe(false);
    const audit = getLocalFileAuditLog();
    expect(audit[0].status).toBe('blocked');
    expect(audit[0].reason).toBe('confirmation_required');
  });

  it('allows create_directory and audits it', async () => {
    const req = createRequest({ operation: 'create_directory', relativePath: 'new_folder' });
    const res = await localFileToolExecutor(req, descriptor, mockAdapter, true);
    expect((res as any).success).toBe(true);
    const audit = getLocalFileAuditLog();
    expect(audit[0].status).toBe('allowed');
    expect(audit[0].operation).toBe('create_directory');
  });
});
