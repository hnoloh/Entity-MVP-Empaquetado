import type { WorkspaceState } from '../../types/WorkspaceState';

export interface RestoreEntityLifecycleRequest {
  explicitApplicationAction: boolean;
  workspaceShellMounted: boolean;
  currentWorkspaceState: WorkspaceState;
}

export interface RestoreEntityLifecycleResult {
  status: 'success' | 'blocked' | 'controlled_error';
  error?: string;
}

export function restoreEntityLifecycleFlow(request: RestoreEntityLifecycleRequest): RestoreEntityLifecycleResult {
  if (!request.explicitApplicationAction) {
    return {
      status: 'blocked',
      error: 'Explicit application action required to restore application'
    };
  }

  if (!request.workspaceShellMounted) {
    return {
      status: 'controlled_error',
      error: 'WorkspaceShell must be mounted to process restore'
    };
  }

  if (request.currentWorkspaceState !== 'minimizado') {
    return {
      status: 'controlled_error',
      error: 'Application is not in a minimized state, cannot restore'
    };
  }

  return {
    status: 'success'
  };
}
