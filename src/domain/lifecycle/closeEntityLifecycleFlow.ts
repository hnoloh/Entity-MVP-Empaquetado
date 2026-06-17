export interface CloseEntityLifecycleRequest {
  explicitUserAction: boolean;
  platformCloseEvent: boolean;
  workspaceShellMounted: boolean;
  currentStartupStatus: 'pending' | 'success' | 'controlled_error' | 'blocked';
}

export interface CloseEntityLifecycleResult {
  status: 'success' | 'blocked' | 'controlled_error';
  error?: string;
}

export function closeEntityLifecycleFlow(request: CloseEntityLifecycleRequest): CloseEntityLifecycleResult {
  if (!request.explicitUserAction && !request.platformCloseEvent) {
    return {
      status: 'blocked',
      error: 'Explicit user action or platform close event required to close application'
    };
  }

  if (!request.workspaceShellMounted) {
    return {
      status: 'controlled_error',
      error: 'WorkspaceShell must be mounted to process close event securely'
    };
  }

  if (request.currentStartupStatus === 'pending') {
    return {
      status: 'controlled_error',
      error: 'Cannot safely close application while startup is pending (potential state corruption)'
    };
  }

  return {
    status: 'success'
  };
}
