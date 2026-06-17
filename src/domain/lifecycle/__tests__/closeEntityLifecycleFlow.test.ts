import { describe, it, expect } from 'vitest';
import { closeEntityLifecycleFlow, type CloseEntityLifecycleRequest } from '../closeEntityLifecycleFlow';

describe('closeEntityLifecycleFlow', () => {
  it('TEST-LIFECYCLE-CLOSE-01: Devuelve blocked si falta acción explícita', () => {
    const request: CloseEntityLifecycleRequest = {
      explicitUserAction: false,
      platformCloseEvent: false,
      workspaceShellMounted: true,
      currentStartupStatus: 'success'
    };
    
    const result = closeEntityLifecycleFlow(request);
    
    expect(result.status).toBe('blocked');
    expect(result.error).toContain('Explicit user action or platform close event required');
  });

  it('TEST-LIFECYCLE-CLOSE-02: Devuelve controlled_error si el Workspace no está montado', () => {
    const request: CloseEntityLifecycleRequest = {
      explicitUserAction: true,
      platformCloseEvent: false,
      workspaceShellMounted: false,
      currentStartupStatus: 'success'
    };
    
    const result = closeEntityLifecycleFlow(request);
    
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('WorkspaceShell must be mounted');
  });

  it('TEST-LIFECYCLE-CLOSE-03: Devuelve controlled_error si el estado de arranque es pending', () => {
    const request: CloseEntityLifecycleRequest = {
      explicitUserAction: true,
      platformCloseEvent: false,
      workspaceShellMounted: true,
      currentStartupStatus: 'pending'
    };
    
    const result = closeEntityLifecycleFlow(request);
    
    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('Cannot safely close application while startup is pending');
  });

  it('TEST-LIFECYCLE-CLOSE-04: Devuelve success si la acción es explícita y el estado es coherente', () => {
    const request: CloseEntityLifecycleRequest = {
      explicitUserAction: true,
      platformCloseEvent: false,
      workspaceShellMounted: true,
      currentStartupStatus: 'success'
    };
    
    const result = closeEntityLifecycleFlow(request);
    
    expect(result.status).toBe('success');
  });

  it('TEST-LIFECYCLE-CLOSE-05: Devuelve success si viene de un evento de plataforma', () => {
    const request: CloseEntityLifecycleRequest = {
      explicitUserAction: false,
      platformCloseEvent: true,
      workspaceShellMounted: true,
      currentStartupStatus: 'success'
    };
    
    const result = closeEntityLifecycleFlow(request);
    
    expect(result.status).toBe('success');
  });
});
