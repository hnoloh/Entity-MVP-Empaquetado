import { describe, it, expect } from 'vitest';
import { startEntityLifecycleFlow, EntityStartupRequest } from '../startEntityLifecycleFlow';

describe('startEntityLifecycleFlow', () => {
  it('TEST-LIFECYCLE-01: Devuelve success en un arranque limpio', () => {
    const request: EntityStartupRequest = {
      explicitApplicationAction: true,
      storageAvailable: true,
      workspaceShellMounted: true
    };
    const result = startEntityLifecycleFlow(request);
    expect(result.status).toBe('success');
  });

  it('TEST-LIFECYCLE-02: Devuelve controlled_error si el storage físico es inaccesible', () => {
    const request: EntityStartupRequest = {
      explicitApplicationAction: true,
      storageAvailable: false,
      workspaceShellMounted: true
    };
    const result = startEntityLifecycleFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Storage');
  });

  it('TEST-LIFECYCLE-03: Devuelve blocked si falta acción explícita de arranque', () => {
    const request: EntityStartupRequest = {
      explicitApplicationAction: false,
      storageAvailable: true,
      workspaceShellMounted: true
    };
    const result = startEntityLifecycleFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toContain('Missing explicit');
  });

  it('TEST-LIFECYCLE-04: Devuelve controlled_error si WorkspaceShell reporta fallo de montaje', () => {
    const request: EntityStartupRequest = {
      explicitApplicationAction: true,
      storageAvailable: true,
      workspaceShellMounted: false
    };
    const result = startEntityLifecycleFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('WorkspaceShell');
  });
});
