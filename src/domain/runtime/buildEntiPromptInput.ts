import type { Enti } from '../enti/Enti';
import type { Chat } from '../chat/Chat';
import type { ProviderExecutionInput } from './provider/ProviderBridge';

export function buildEntiPromptInput(enti: Enti, chat: Chat): ProviderExecutionInput {
  // Conversión básica de historial a string prompt (mínimo operativo para regularización)
  const historyText = chat.history.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  const systemPrompt = `You are ${enti.name}. Function: ${enti.harness.function}. Rules: ${enti.harness.rules.join(', ')}`;
  
  return {
    prompt: historyText,
    systemPrompt: systemPrompt
  };
}
