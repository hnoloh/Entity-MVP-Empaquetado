import { describe, it, expect } from 'vitest';
import { minimizeEntityLifecycleFlow, type EntityMinimizeRequest } from '../minimizeEntityLifecycleFlow';

describe('minimizeEntityLifecycleFlow', () => {
  it('TEST-LIFECYCLE-MIN-01: Devuelve blocked si falta acción explícita', () => {
    const request: EntityMinimizeRequest = {
      explicitApplicationAction: false,
      workspaceShellMounted: true,
      currentStartupStatus: 'success'
    };
    
    const result = minimizeEntityLifecycleFlow(request);
    
    expect(result.status).toBe('blocked');
    expect(result.error).toContain('Explicit application action required');
  });

  it('TEST-LIFECYCLE-MIN-02: Devuelve controlled_error si el estado lifecycle es incoherente (pending)', () => {
    const request: EntityMinimizeRequest = {
      explicitApplicationAction: true,
      workspaceShellMounted: true,
      currentStartupStatus: 'pending'
    };
    
    const result = minimizeEntityLifecycleFlow(request);
    
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Cannot minimize while startup is pending');
  });

  it('TEST-LIFECYCLE-MIN-03: Devuelve controlled_error si el Workspace no está montado', () => {
    const request: EntityMinimizeRequest = {
      explicitApplicationAction: true,
      workspaceShellMounted: false,
      currentStartupStatus: 'success'
    };
    
    const result = minimizeEntityLifecycleFlow(request);
    
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('WorkspaceShell must be mounted');
  });

  it('TEST-LIFECYCLE-MIN-04: Devuelve success tras carga operativa válida', () => {
    const request: EntityMinimizeRequest = {
      explicitApplicationAction: true,
      workspaceShellMounted: true,
      currentStartupStatus: 'success'
    };
    
    const result = minimizeEntityLifecycleFlow(request);
    
    expect(result.status).toBe('success');
  });

  it('TEST-LIFECYCLE-MIN-05: Devuelve success incluso si startupStatus es controlled_error o blocked (permite minimizar en error)', () => {
    const request: EntityMinimizeRequest = {
      explicitApplicationAction: true,
      workspaceShellMounted: true,
      currentStartupStatus: 'controlled_error'
    };
    
    const result = minimizeEntityLifecycleFlow(request);
    
    expect(result.status).toBe('success');
  });
});
