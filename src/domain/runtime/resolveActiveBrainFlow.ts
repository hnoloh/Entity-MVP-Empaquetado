import type { ActiveBrainResolutionRequest } from './RuntimeExecutionRequest';
import type { ActiveBrainResolutionResult } from './RuntimeExecutionResult';
import type { Enti } from '../enti/Enti';
import type { Chat } from '../chat/Chat';
import { startRuntimeExecutionFlow } from './startRuntimeExecutionFlow';

export function resolveActiveBrainFlow(
  request: ActiveBrainResolutionRequest,
  targetEnti: Enti | undefined | null,
  targetChat: Chat | undefined | null
): ActiveBrainResolutionResult {
  // 1. Validar que la request base es válida
  const baseResult = startRuntimeExecutionFlow(request);
  if (!baseResult.success) {
    return {
      success: false,
      brainResolved: false,
      error: baseResult.error || 'Invalid base request'
    };
  }

  // 2. Validar que el Chat objetivo existe
  if (!targetChat) {
    return {
      success: false,
      brainResolved: false,
      error: `Chat target not found: ${request.chatId}`
    };
  }

  // 3. Validar que el Enti objetivo existe
  if (!targetEnti) {
    return {
      success: false,
      brainResolved: false,
      error: `Enti target not found: ${request.entiId}`
    };
  }

  // 4. Validar que el Enti tiene un Brain configurado (no unconfigured)
  const cognitiveConfig = targetEnti.cognitiveConfig;
  if (!cognitiveConfig || cognitiveConfig.mode === 'unconfigured') {
    return {
      success: false,
      brainResolved: false,
      error: `Enti has no active brain configured`
    };
  }

  // Si es local, debe tener proveedor y modelo (básico). Si es cloud, apiKey.
  if (cognitiveConfig.mode === 'local' && (!cognitiveConfig.provider || !cognitiveConfig.model)) {
     return {
        success: false,
        brainResolved: false,
        error: `Local brain is missing provider or model`
     }
  }

  if (cognitiveConfig.mode === 'cloud' && !cognitiveConfig.apiKey) {
      return {
        success: false,
        brainResolved: false,
        error: `Cloud brain is missing API key`
     }
  }

  // 5. Brain resuelto con éxito
  return {
    success: true,
    brainResolved: true,
    activeBrain: cognitiveConfig
  };
}
