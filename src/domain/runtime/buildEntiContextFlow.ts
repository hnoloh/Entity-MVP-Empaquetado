import type { EntiContextBuildRequest } from './RuntimeExecutionRequest';
import type { EntiContextBuildResult } from './RuntimeExecutionResult';
import type { Enti } from '../enti/Enti';
import type { Chat } from '../chat/Chat';
import { resolveActiveBrainFlow } from './resolveActiveBrainFlow';

export function buildEntiContextFlow(
  request: EntiContextBuildRequest,
  targetEnti: Enti | undefined | null,
  targetChat: Chat | undefined | null
): EntiContextBuildResult {
  // 1. Resolver el Brain activo (que a su vez valida la request base, el Enti y el Chat)
  const brainResolution = resolveActiveBrainFlow(request, targetEnti, targetChat);

  if (!brainResolution.success || !brainResolution.brainResolved) {
    return {
      success: false,
      error: brainResolution.error || 'Failed to resolve active brain for context'
    };
  }

  // 2. Construir el contexto estructurado
  return {
    success: true,
    contextId: `ctx-${Date.now()}`,
    entiId: request.entiId,
    chatId: request.chatId,
    activeBrain: brainResolution.activeBrain
  };
}
