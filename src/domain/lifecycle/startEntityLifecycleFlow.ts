export interface EntityStartupRequest {
  explicitApplicationAction: boolean;
  storageAvailable?: boolean;
  workspaceShellMounted?: boolean;
}

export interface EntityStartupResult {
  status: 'success' | 'blocked' | 'controlled_error';
  error?: string;
}

export function startEntityLifecycleFlow(request: EntityStartupRequest): EntityStartupResult {
  if (!request.explicitApplicationAction) {
    return { status: 'blocked', error: 'Missing explicit application startup action' };
  }

  if (request.storageAvailable === false) {
    return { status: 'controlled_error', error: 'Storage unavailable or corrupted during bootstrap' };
  }

  if (request.workspaceShellMounted === false) {
    return { status: 'controlled_error', error: 'WorkspaceShell failed to mount or is unavailable' };
  }

  return { status: 'success' };
}
