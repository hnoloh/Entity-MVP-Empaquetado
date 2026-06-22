import type { ProviderExecutionInput } from '../../runtime/provider/ProviderBridge';
import type { EntiPromptContextualSourceBlock } from './entiPromptContextualSourceTypes';

export function injectEntiContextualSourcesIntoPromptEngine(
  input: ProviderExecutionInput,
  block: EntiPromptContextualSourceBlock
): { status: 'success'; injectedInput: ProviderExecutionInput } {
  let injection = '';

  if (block.knowledgeSources.length > 0) {
    injection += '### CONOCIMIENTOS BASE (Material de consulta pasiva):\n';
    block.knowledgeSources.forEach((src, idx) => {
      const title = src.fileName ? `[Documento: ${src.fileName}]` : `[Fuente ${idx + 1}]`;
      injection += `${title}\n${src.contentText}\n\n`;
    });
  }

  if (block.workMaterialSources.length > 0) {
    injection += '### MATERIAL DE TRABAJO ACTIVO (Analizar o procesar según instrucciones):\n';
    block.workMaterialSources.forEach((src, idx) => {
      const title = src.fileName ? `[Material: ${src.fileName}]` : `[Material ${idx + 1}]`;
      injection += `${title}\n${src.contentText}\n\n`;
    });
  }

  if (block.chatSources.length > 0) {
    injection += '### ADJUNTOS DEL CHAT (Memoria de la conversación actual):\n';
    block.chatSources.forEach((src, idx) => {
      const title = src.fileName ? `[Adjunto: ${src.fileName}]` : `[Adjunto ${idx + 1}]`;
      injection += `${title}\n${src.contentText}\n\n`;
    });
  }

  if (!injection) {
    return {
      status: 'success',
      injectedInput: { ...input }
    };
  }

  // Append the injection text to the end of the user prompt, NOT the system prompt.
  // Also update the last message in the messages array if it exists.
  const newPrompt = `${input.prompt}\n\n${injection.trim()}`;
  
  let newMessages = input.messages;
  if (newMessages && newMessages.length > 0) {
    newMessages = [...newMessages];
    const lastMsg = newMessages[newMessages.length - 1];
    if (lastMsg.role === 'user') {
      newMessages[newMessages.length - 1] = {
        ...lastMsg,
        content: `${lastMsg.content}\n\n${injection.trim()}`
      };
    }
  }

  return {
    status: 'success',
    injectedInput: {
      ...input,
      prompt: newPrompt,
      messages: newMessages
    }
  };
}
