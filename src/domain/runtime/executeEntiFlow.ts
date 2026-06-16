import type { EntiExecutionRequest } from './RuntimeExecutionRequest';
import type { EntiExecutionResult } from './RuntimeExecutionResult';
import type { Enti } from '../enti/Enti';
import type { Chat } from '../chat/Chat';
import { buildEntiContextFlow } from './buildEntiContextFlow';
import { buildEntiPromptInput } from './buildEntiPromptInput';
import type { ProviderBridge } from './provider/ProviderBridge';

export async function executeEntiFlow(
  request: EntiExecutionRequest,
  targetEnti: Enti | undefined | null,
  targetChat: Chat | undefined | null,
  provider?: ProviderBridge
): Promise<EntiExecutionResult> {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Execution requires explicit user action' };
  }

  const contextResult = buildEntiContextFlow(request, targetEnti, targetChat);
  if (!contextResult.success) {
    return { status: 'controlled_error', error: contextResult.error || 'Failed to build execution context' };
  }

  if (!provider) {
    return { status: 'controlled_error', error: 'Provider not authorized or missing' };
  }

  const promptInput = buildEntiPromptInput(targetEnti!, targetChat!);
  const providerResult = await provider.execute(promptInput);

  if (!providerResult.success) {
    return { status: 'controlled_error', error: providerResult.error || 'Provider execution failed' };
  }

  return {
    status: 'executed',
    executionId: `exec-${Date.now()}`,
    entiId: request.entiId,
    chatId: request.chatId,
    contextId: contextResult.contextId,
    brainId: contextResult.activeBrain?.mode,
    responseText: providerResult.responseText
  };
}
