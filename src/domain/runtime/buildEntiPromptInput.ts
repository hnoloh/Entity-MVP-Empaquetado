import type { Enti } from '../enti/Enti';
import type { Chat } from '../chat/Chat';
import type { ProviderExecutionInput } from './provider/ProviderBridge';
import { attachmentsStore } from '../../components/Chat/attachmentsStore';
import { resolveEntiContextualSources } from '../attachments/resolveEntiContextualSources';
import { buildEntiPromptContextualSourceBlock } from '../prompt-engine/attachments/buildEntiPromptContextualSourceBlock';
import { injectEntiContextualSourcesIntoPromptEngine } from '../prompt-engine/attachments/injectEntiContextualSourcesIntoPromptEngine';

export function buildEntiPromptInput(enti: Enti, chat: Chat): ProviderExecutionInput {
  let promptText = '';
  
  if (chat.history.length === 1) {
    promptText = `[Usuario]: ${chat.history[0].content}`;
  } else if (chat.history.length > 1) {
    const originalRequest = chat.history[0].content;
    const historyText = chat.history.slice(1).map((msg) => {
      return `[${msg.role === 'assistant' ? `Resultado de Paso Anterior` : 'Corrección del Usuario'}]: ${msg.content}`;
    }).join('\n\n');
    
    promptText = `Instrucción original del usuario:\n${originalRequest}\n\nHistorial del proceso:\n${historyText}\n\nTu tarea: Procesa el último paso según tu Función y Reglas asignadas. Aporta tu propio análisis o resultado. NO repitas literalmente el resultado anterior.`;
  }

  let systemPrompt = `Eres ${enti.name}. Función: ${enti.harness.function}. Reglas: ${enti.harness.rules.join(', ')}. Responde siempre en el mismo idioma en el que se te hable (por defecto español).`;
  
  if (enti.harness.knowledge && enti.harness.knowledge.trim() !== '') {
    systemPrompt += `\n\nConocimientos Base Adicionales:\n${enti.harness.knowledge}`;
  }

  if (enti.harness.workMaterial && enti.harness.workMaterial.trim() !== '') {
    systemPrompt += `\n\nMaterial de Trabajo Activo:\n${enti.harness.workMaterial}`;
  }

  const baseInput: ProviderExecutionInput = {
    prompt: promptText,
    systemPrompt: systemPrompt
  };

  const attachments = attachmentsStore.getAttachmentsForChat(chat.id);
  const resolveResult = resolveEntiContextualSources({
    ownerId: enti.id,
    attachments: attachments
  });

  if (resolveResult.status === 'success' && resolveResult.sources) {
    const blockResult = buildEntiPromptContextualSourceBlock(enti.id, chat.id, resolveResult.sources);
    if (blockResult.status === 'success') {
      const injectResult = injectEntiContextualSourcesIntoPromptEngine(baseInput, blockResult.block);
      return injectResult.injectedInput;
    }
  }

  return baseInput;
}
