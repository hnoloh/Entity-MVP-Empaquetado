import type { RuntimeExecutionRequest } from './RuntimeExecutionRequest';
import type { RuntimeExecutionStartResult } from './RuntimeExecutionResult';

export function startRuntimeExecutionFlow(request: RuntimeExecutionRequest): RuntimeExecutionStartResult {
  if (!request.explicitUserAction) {
    return {
      success: false,
      status: 'rejected',
      error: 'Execution requires explicit user action'
    };
  }

  if (request.targetType !== 'ENTI') {
    return {
      success: false,
      status: 'rejected',
      error: 'Target type must be ENTI'
    };
  }

  if (!request.entiId || request.entiId.trim() === '') {
    return {
      success: false,
      status: 'rejected',
      error: 'entiId is required'
    };
  }

  if (!request.chatId || request.chatId.trim() === '') {
    return {
      success: false,
      status: 'rejected',
      error: 'chatId is required'
    };
  }

  return {
    success: true,
    status: 'started',
    executionId: `exec-${Date.now()}`
  };
}
