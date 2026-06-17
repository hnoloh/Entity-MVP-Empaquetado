export interface EntityMinimizeRequest {
  explicitApplicationAction: boolean;
  workspaceShellMounted: boolean;
  currentStartupStatus: 'pending' | 'success' | 'controlled_error' | 'blocked';
}

export interface EntityMinimizeResult {
  status: 'success' | 'blocked' | 'controlled_error';
  error?: string;
}

export function minimizeEntityLifecycleFlow(request: EntityMinimizeRequest): EntityMinimizeResult {
  if (!request.explicitApplicationAction) {
    return {
      status: 'blocked',
      error: 'Explicit application action required to minimize application'
    };
  }

  if (!request.workspaceShellMounted) {
    return {
      status: 'controlled_error',
      error: 'WorkspaceShell must be mounted to process minimize'
    };
  }

  if (request.currentStartupStatus === 'pending') {
    return {
      status: 'controlled_error',
      error: 'Cannot minimize while startup is pending'
    };
  }

  return {
    status: 'success'
  };
}
