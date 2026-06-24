import { restoreOperationalStateFlow, type OperationalRestoreResult } from '../operationalRestore';
import type { OperationalPersistenceSnapshot_RV09 } from './operationalPersistenceSnapshot';
import { applyRuntimeStateRestoreGuard } from './runtimeStateRestoreGuard';
import type { MultiWindowPersistenceSnapshot } from './multiWindowPersistenceSnapshot';

export interface DesktopOperationalRestoreRequest {
  explicitUserAction: boolean;
  payload: unknown;
}

export interface DesktopOperationalRestoreResult extends OperationalRestoreResult {
  multiWindowPayload?: MultiWindowPersistenceSnapshot;
}

export function enforceDesktopOperationalRestorePolicy(request: DesktopOperationalRestoreRequest): DesktopOperationalRestoreResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Missing explicit user action' };
  }

  const payload = request.payload as Record<string, unknown>;
  if (!payload || typeof payload !== 'object') {
    return { status: 'controlled_error', error: 'Payload must be an object' };
  }

  if (payload.root !== 'operational_restore_rv09') {
    return { status: 'controlled_error', error: 'Invalid root in RV09 payload' };
  }

  const rv09Payload = payload as unknown as OperationalPersistenceSnapshot_RV09;
  
  if (!rv09Payload.basePayload) {
    return { status: 'controlled_error', error: 'Missing basePayload' };
  }

  // 1. Guard anti auto-run
  const guardedBasePayload = applyRuntimeStateRestoreGuard(rv09Payload.basePayload);

  // 2. Delegate core restore
  const baseRes = restoreOperationalStateFlow({
    explicitUserAction: true,
    payload: guardedBasePayload
  });

  if (baseRes.status !== 'success') {
    return baseRes;
  }

  return {
    status: 'success',
    restoredState: baseRes.restoredState,
    multiWindowPayload: rv09Payload.multiWindowPayload
  };
}
