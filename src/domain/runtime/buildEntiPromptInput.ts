/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Enti } from '../enti/Enti';
import type { Chat } from '../chat/Chat';
import type { ProviderExecutionInput } from './provider/ProviderBridge';
import { attachmentsStore } from '../../components/Chat/attachmentsStore';
import { resolveEntiContextualSources } from '../attachments/resolveEntiContextualSources';
import { buildEntiPromptContextualSourceBlock } from '../prompt-engine/attachments/buildEntiPromptContextualSourceBlock';
import { injectEntiContextualSourcesIntoPromptEngine } from '../prompt-engine/attachments/injectEntiContextualSourcesIntoPromptEngine';

import { toolAuthorizationRepository } from '../tools/toolAuthorizationRepository';
import { MOCK_REGISTRY_BASE } from '../tools/mockRegistry';

export function buildEntiPromptInput(enti: Enti, chat: Chat): ProviderExecutionInput {
  let promptText = '';
  
  if (chat.history.length === 1) {
    promptText = `[Usuario]: ${chat.history[0].content}`;
  }
  let mappedMessages = chat.history.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }));

  if (chat.history.length > 1) {
    const originalRequest = chat.history[0].content;
    const historyText = chat.history.slice(1).map((msg) => {
      return `[${msg.role === 'assistant' ? `Resultado de Paso Anterior` : 'Corrección del Usuario'}]: ${msg.content}`;
    }).join('\n\n');
    
    promptText = `Instrucción original del usuario:\n${originalRequest}\n\nHistorial del proceso:\n${historyText}\n\nTu tarea: Procesa el último paso según tu Función y Reglas asignadas. Aporta tu propio análisis o resultado. NO repitas literalmente el resultado anterior.`;
    
    mappedMessages = [
      { role: 'user', content: promptText }
    ];
  }

  let systemPrompt = `Eres ${enti.name}. Función: ${enti.harness.function}. Reglas: ${enti.harness.rules.join(', ')}. Responde siempre en el mismo idioma en el que se te hable (por defecto español).`;
  
  if (enti.harness.knowledge && enti.harness.knowledge.trim() !== '') {
    systemPrompt += `\n\nConocimientos Base Adicionales:\n${enti.harness.knowledge}`;
  }

  if (enti.harness.workMaterial && enti.harness.workMaterial.trim() !== '') {
    systemPrompt += `\n\nMaterial de Trabajo Activo:\n${enti.harness.workMaterial}`;
  }

  const nativeTools: any[] = [];
  
  const auths = toolAuthorizationRepository.list();
  const allTools = Object.values(MOCK_REGISTRY_BASE.definitions);
  
  const authorizedTools = allTools.filter((def: unknown) => 
    auths.some((auth) => auth.entiId === enti.id && (def as {id: string}).id === auth.toolId && auth.state === 'authorized')
  );

  if (authorizedTools.length > 0) {
    authorizedTools.forEach((t: unknown) => {
      const tool = t as { id: string; function?: { name: string; description: string; parameters: unknown } };
      if (tool.id === 'tool-gen-docx') {
        nativeTools.push({
          type: 'function',
          function: {
            name: 'generate_docx',
            description: 'Generates a DOCX file. If the user asks for a download link, leave targetPath empty and output the sandbox link. If the user asks to save it to a specific folder or to their Desktop, provide the targetPath and DO NOT output a download link.',
            parameters: {
              type: 'object',
              properties: {
                filename: { type: 'string', description: 'Name of the file, e.g. "documento.docx"' },
                content: { type: 'string', description: 'The text content to be written inside the DOCX document.' },
                targetPath: { type: 'string', description: 'Optional. The relative path where the document should be saved (e.g., "escritorio" or "carpeta1"). Leave this empty ONLY if the user specifically requests a download link instead of saving the file.' }
              },
              required: ['filename', 'content']
            }
          }
        });
      } else if (tool.id === 'tool-gen-pdf') {
        nativeTools.push({
          type: 'function',
          function: {
            name: 'generate_pdf',
            description: 'Generates a PDF file. If the user asks for a download link, leave targetPath empty and output the sandbox link. If the user asks to save it to a specific folder or to their Desktop, provide the targetPath and DO NOT output a download link.',
            parameters: {
              type: 'object',
              properties: {
                filename: { type: 'string', description: 'Name of the file, e.g. "documento.pdf"' },
                content: { type: 'string', description: 'The text content to be written inside the PDF document.' },
                targetPath: { type: 'string', description: 'Optional. The relative path where the document should be saved (e.g., "escritorio" or "carpeta1"). Leave this empty ONLY if the user specifically requests a download link instead of saving the file.' }
              },
              required: ['filename', 'content']
            }
          }
        });
      } else if (tool.id === 'tool-gen-html') {
        nativeTools.push({
          type: 'function',
          function: {
            name: 'generate_html',
            description: 'Generates an HTML file. If the user asks for a download link, leave targetPath empty and output the sandbox link. If the user asks to save it to a specific folder or to their Desktop, provide the targetPath and DO NOT output a download link.',
            parameters: {
              type: 'object',
              properties: {
                filename: { type: 'string', description: 'Name of the file, e.g. "index.html"' },
                content: { type: 'string', description: 'The text content to be written inside the HTML document.' },
                targetPath: { type: 'string', description: 'Optional. The relative path where the document should be saved (e.g., "escritorio" or "carpeta1"). Leave this empty ONLY if the user specifically requests a download link instead of saving the file.' }
              },
              required: ['filename', 'content']
            }
          }
        });
      } else if (tool.id === 'tool-fs') {
        nativeTools.push({
          type: 'function',
          function: {
            name: 'manage_local_filesystem',
            description: 'Manages files and directories in the local workspace. Operations: list, read, write, overwrite, delete, create_directory. ONLY USE THIS if the user explicitly asks to interact with the file system. DO NOT USE THIS if the user just says hello or asks a general question.',
            parameters: {
              type: 'object',
              properties: {
                operation: { type: 'string', enum: ['list', 'read', 'write', 'overwrite', 'delete', 'create_directory'], description: 'The operation to perform' },
                relativePath: { type: 'string', description: 'Relative path to the target file or directory, e.g. "mi_carpeta/archivo.txt" or "casa"' },
                content: { type: 'string', description: 'Text content to write to the file. Required for write and overwrite operations.' }
              },
              required: ['operation', 'relativePath']
            }
          }
        });
      }
    });

      nativeTools.push({
        type: 'function',
        function: {
          name: 'reply_to_user',
          description: 'ÚSALA OBLIGATORIAMENTE para responder al usuario con texto normal cuando te salude (ej. "hola") o haga una pregunta general que no requiera interactuar con archivos ni generar documentos.',
          parameters: {
            type: 'object',
            properties: {
              message: { type: 'string', description: 'Tu respuesta conversacional para el usuario' }
            },
            required: ['message']
          }
        }
      });

      systemPrompt += `\n\nATENCIÓN: Tienes acceso a herramientas (tools).
REGLAS ESTRICTAS PARA EL USO DE HERRAMIENTAS:
1. Si el usuario te pide CREAR UNA CARPETA, LEER, ESCRIBIR, o interactuar con el sistema de archivos de cualquier manera, DEBES usar la herramienta "manage_local_filesystem" con la operación correcta. NO uses "reply_to_user" para esto.
2. Si el usuario solo te dice "hola", "buenos días" o hace charla general, DEBES usar la herramienta "reply_to_user" para responderle.`;
    }

  const baseInput: ProviderExecutionInput = {
    prompt: promptText,
    messages: mappedMessages,
    systemPrompt: systemPrompt,
    tools: nativeTools.length > 0 ? nativeTools : undefined
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
