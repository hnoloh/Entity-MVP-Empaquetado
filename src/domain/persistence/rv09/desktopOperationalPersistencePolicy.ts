import { runPersistenceHarnessFlow, type PersistenceHarnessRequest } from '../persistenceHarness';
import type { OperationalPersistenceSnapshot_RV09 } from './operationalPersistenceSnapshot';
import type { MultiWindowPersistenceSnapshot } from './multiWindowPersistenceSnapshot';

export interface DesktopOperationalPersistenceRequest {
  explicitUserAction: boolean;
  baseRequest: PersistenceHarnessRequest;
  multiWindowPayload?: MultiWindowPersistenceSnapshot;
}

export interface DesktopOperationalPersistenceResult {
  status: 'success' | 'blocked' | 'controlled_error';
  payload?: OperationalPersistenceSnapshot_RV09;
  error?: string;
}

export function enforceDesktopOperationalPersistencePolicy(request: DesktopOperationalPersistenceRequest): DesktopOperationalPersistenceResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Missing explicit user action' };
  }

  const baseRes = runPersistenceHarnessFlow(request.baseRequest);
  if (baseRes.status !== 'success') {
    return { status: baseRes.status, error: baseRes.error };
  }

  const snapshot: OperationalPersistenceSnapshot_RV09 = {
    root: 'operational_restore_rv09',
    version: '1.0',
    basePayload: {
      root: 'operational_restore',
      version: '1.0',
      data: {
        entiPayload: baseRes.entiPayload,
        groupPayload: baseRes.groupPayload,
        cognitivePayload: baseRes.cognitivePayload,
        chatPayload: baseRes.chatPayload,
        sequencePayload: baseRes.sequencePayload,
        positionPayload: baseRes.positionPayload,
        toolAuthorizationsPayload: baseRes.toolAuthorizationsPayload
      }
    },
    multiWindowPayload: request.multiWindowPayload
  };

  return { status: 'success', payload: snapshot };
}
