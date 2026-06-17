import type { GroupSequenceRestartRequest } from './RuntimeExecutionRequest';
import type { GroupSequenceRestartResult } from './RuntimeExecutionResult';

export const restartGroupSequenceFlow = (
  request: GroupSequenceRestartRequest
): GroupSequenceRestartResult => {
  if (!request.explicitUserAction) {
    return {
      status: 'blocked',
      error: 'Restart requires explicit user action',
    };
  }

  if (!request.groupId) {
    return {
      status: 'controlled_error',
      error: 'Missing groupId',
    };
  }

  if (request.targetSequenceState) {
    if (request.targetSequenceState.groupId && request.targetSequenceState.groupId !== request.groupId) {
      return {
        status: 'controlled_error',
        error: 'Incoherent target sequence state: groupId mismatch',
      };
    }
  }

  return {
    status: 'restarted',
    groupId: request.groupId,
  };
};
