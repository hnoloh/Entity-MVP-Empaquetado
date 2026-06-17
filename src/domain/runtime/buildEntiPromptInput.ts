import type { Enti } from '../enti/Enti';
import type { Chat } from '../chat/Chat';
import type { ProviderExecutionInput } from './provider/ProviderBridge';

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

  const systemPrompt = `Eres ${enti.name}. Función: ${enti.harness.function}. Reglas: ${enti.harness.rules.join(', ')}. Responde siempre en el mismo idioma en el que se te hable (por defecto español).`;
  
  return {
    prompt: promptText,
    systemPrompt: systemPrompt
  };
}
