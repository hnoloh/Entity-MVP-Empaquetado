import { runPersistenceHarnessFlow, type PersistenceHarnessResult } from './persistenceHarness';

export interface OperationalRestorePayload {
  root: 'operational_restore';
  version: string;
  data: {
    entiPayload?: unknown;
    groupPayload?: unknown;
    cognitivePayload?: unknown;
    chatPayload?: unknown;
    sequencePayload?: unknown;
    positionPayload?: unknown;
  };
}

export interface OperationalRestoreRequest {
  explicitUserAction: boolean;
  payload: unknown;
}

export interface OperationalRestoreResult {
  status: 'success' | 'blocked' | 'controlled_error';
  error?: string;
  restoredState?: PersistenceHarnessResult;
}

export function restoreOperationalStateFlow(request: OperationalRestoreRequest): OperationalRestoreResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Missing explicit user action' };
  }

  const payload = request.payload as Record<string, unknown>;

  if (!payload || typeof payload !== 'object') {
    return { status: 'controlled_error', error: 'Payload must be an object' };
  }

  if (payload.root !== 'operational_restore') {
    return { status: 'controlled_error', error: `Invalid root in payload: ${payload.root}` };
  }

  const data = payload.data as Record<string, unknown>;
  if (!data || typeof data !== 'object') {
    return { status: 'controlled_error', error: 'Payload data must be an object' };
  }

  // Use the harness to do an all-or-nothing validation/restoration
  const harnessResult = runPersistenceHarnessFlow({
    explicitUserAction: true,
    action: 'restore',
    mode: 'full',
    entiPayload: data.entiPayload,
    groupPayload: data.groupPayload,
    cognitivePayload: data.cognitivePayload,
    chatPayload: data.chatPayload,
    sequencePayload: data.sequencePayload,
    positionPayload: data.positionPayload,
    enforceCrossReferenceConsistency: true
  });

  if (harnessResult.status !== 'success') {
    return { status: harnessResult.status, error: harnessResult.error };
  }

  return {
    status: 'success',
    restoredState: harnessResult
  };
}
