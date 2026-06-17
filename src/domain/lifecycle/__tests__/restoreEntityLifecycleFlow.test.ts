import { describe, it, expect } from 'vitest';
import { restoreEntityLifecycleFlow, type RestoreEntityLifecycleRequest } from '../restoreEntityLifecycleFlow';

describe('restoreEntityLifecycleFlow', () => {
  it('TEST-LIFECYCLE-REST-01: Devuelve blocked si falta acción explícita', () => {
    const request: RestoreEntityLifecycleRequest = {
      explicitApplicationAction: false,
      workspaceShellMounted: true,
      currentWorkspaceState: 'minimizado'
    };
    
    const result = restoreEntityLifecycleFlow(request);
    
    expect(result.status).toBe('blocked');
    expect(result.error).toContain('Explicit application action required');
  });

  it('TEST-LIFECYCLE-REST-02: Devuelve controlled_error si el Workspace no está montado', () => {
    const request: RestoreEntityLifecycleRequest = {
      explicitApplicationAction: true,
      workspaceShellMounted: false,
      currentWorkspaceState: 'minimizado'
    };
    
    const result = restoreEntityLifecycleFlow(request);
    
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('WorkspaceShell must be mounted');
  });

  it('TEST-LIFECYCLE-REST-03: Devuelve controlled_error si el estado actual no es minimizado', () => {
    const request: RestoreEntityLifecycleRequest = {
      explicitApplicationAction: true,
      workspaceShellMounted: true,
      currentWorkspaceState: 'visible'
    };
    
    const result = restoreEntityLifecycleFlow(request);
    
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Application is not in a minimized state');
  });

  it('TEST-LIFECYCLE-REST-04: Devuelve success si la aplicación está minimizada y la acción es explícita', () => {
    const request: RestoreEntityLifecycleRequest = {
      explicitApplicationAction: true,
      workspaceShellMounted: true,
      currentWorkspaceState: 'minimizado'
    };
    
    const result = restoreEntityLifecycleFlow(request);
    
    expect(result.status).toBe('success');
  });
});
