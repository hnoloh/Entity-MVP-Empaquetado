import { describe, it, expect } from 'vitest';
import { localFileWorkspacePolicy } from '../localFileWorkspacePolicy';
import type { LocalFileOperationRequest, LocalFileWorkspaceDescriptor } from '../localFileToolTypes';

describe('localFileWorkspacePolicy', () => {
  const descriptor: LocalFileWorkspaceDescriptor = { basePath: '/allowed/workspace' };
  
  const createRequest = (overrides: Partial<LocalFileOperationRequest>): LocalFileOperationRequest => ({
    entiId: 'enti-123',
    operation: 'read',
    relativePath: 'file.txt',
    ...overrides
  });

  it('allows valid relative path and extension', () => {
    const req = createRequest({});
    const res = localFileWorkspacePolicy(req, descriptor);
    expect(res.allowed).toBe(true);
  });

  it('blocks path traversal', () => {
    const req = createRequest({ relativePath: '../secret.txt' });
    const res = localFileWorkspacePolicy(req, descriptor);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('path_traversal');
  });

  it('blocks absolute path', () => {
    const req = createRequest({ relativePath: '/etc/passwd' });
    const res = localFileWorkspacePolicy(req, descriptor);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('absolute_path_not_allowed');
  });

  it('blocks disallowed extensions for read/write', () => {
    const req = createRequest({ relativePath: 'script.js' });
    const res = localFileWorkspacePolicy(req, descriptor);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('extension_not_allowed');
  });

  it('blocks if size exceeded', () => {
    const req = createRequest({});
    const res = localFileWorkspacePolicy(req, descriptor, 6 * 1024 * 1024);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('size_exceeded');
  });

  it('requires confirmation for overwrite', () => {
    const req = createRequest({ operation: 'overwrite' });
    const res = localFileWorkspacePolicy(req, descriptor);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('confirmation_required');
    
    const reqConfirmed = createRequest({ operation: 'overwrite', confirmationToken: true });
    const resConfirmed = localFileWorkspacePolicy(reqConfirmed, descriptor);
    expect(resConfirmed.allowed).toBe(true);
  });

  it('requires confirmation for delete', () => {
    const req = createRequest({ operation: 'delete' });
    const res = localFileWorkspacePolicy(req, descriptor);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('confirmation_required');
    
    const reqConfirmed = createRequest({ operation: 'delete', confirmationToken: true });
    const resConfirmed = localFileWorkspacePolicy(reqConfirmed, descriptor);
    expect(resConfirmed.allowed).toBe(true);
  });

  it('blocks if owner is group', () => {
    const req = createRequest({ entiId: 'group' });
    const res = localFileWorkspacePolicy(req, descriptor);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('owner_group_not_allowed');
  });
});
