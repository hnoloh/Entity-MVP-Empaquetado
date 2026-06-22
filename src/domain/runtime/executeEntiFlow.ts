/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EntiExecutionRequest } from './RuntimeExecutionRequest';
import type { EntiExecutionResult } from './RuntimeExecutionResult';
import type { Enti } from '../enti/Enti';
import type { Chat } from '../chat/Chat';
import { buildEntiContextFlow } from './buildEntiContextFlow';
import { buildEntiPromptInput } from './buildEntiPromptInput';
import type { ProviderBridge } from './provider/ProviderBridge';
import { docxGenerationToolExecutor } from '../tools/docx-generation/docxGenerationToolExecutor';
import { pdfGenerationToolExecutor } from '../tools/pdf-generation/pdfGenerationToolExecutor';
import { htmlGenerationToolExecutor } from '../tools/html-generation/htmlGenerationToolExecutor';
import { localFileToolExecutor } from '../tools/local-files/localFileToolExecutor';
import { getDefaultWorkspaceDescriptor, nodeFileSystemAdapter } from '../tools/local-files';

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

  let finalResponseText = providerResult.responseText || '';

  if (targetEnti) {
    const docxRegex = /<generate_docx filename="([^"]*)">([\s\S]*?)<\/generate_docx>/g;
    let match;
    while ((match = docxRegex.exec(finalResponseText)) !== null) {
      const filename = match[1] || 'documento.docx';
      const res = await docxGenerationToolExecutor.execute({ toolId: 'tool-gen-docx', entiId: request.entiId, filename: filename, content: match[2] });
      if (res.status === 'success') {
        finalResponseText = finalResponseText.replace(match[0], `[Descargar ${filename}](${filename})`);
      } else {
        finalResponseText = finalResponseText.replace(match[0], `[Error al generar ${filename}: ${res.errorReason}]`);
      }
    }

    const pdfRegex = /<generate_pdf filename="([^"]*)">([\s\S]*?)<\/generate_pdf>/g;
    while ((match = pdfRegex.exec(finalResponseText)) !== null) {
      const filename = match[1] || 'documento.pdf';
      const res = await pdfGenerationToolExecutor.execute({ toolId: 'tool-gen-pdf', entiId: request.entiId, filename: filename, content: match[2] });
      if (res.status === 'success') {
        finalResponseText = finalResponseText.replace(match[0], `[Descargar ${filename}](${filename})`);
      } else {
        finalResponseText = finalResponseText.replace(match[0], `[Error al generar ${filename}: ${res.errorReason}]`);
      }
    }

    const htmlRegex = /<generate_html filename="([^"]*)">([\s\S]*?)<\/generate_html>/g;
    while ((match = htmlRegex.exec(finalResponseText)) !== null) {
      const filename = match[1] || 'index.html';
      const res = await htmlGenerationToolExecutor.execute({ toolId: 'tool-gen-html', entiId: request.entiId, filename: filename, htmlContent: match[2] });
      if (res.status === 'success') {
        finalResponseText = finalResponseText.replace(match[0], `[Descargar ${filename}](${filename})`);
      } else {
        finalResponseText = finalResponseText.replace(match[0], `[Error al generar ${filename}: ${res.reason || res.error}]`);
      }
    }

    const fsRegex = /<manage_local_filesystem operation="([^"]+)" relativePath="([^"]*)">([\s\S]*?)<\/manage_local_filesystem>/g;
    while ((match = fsRegex.exec(finalResponseText)) !== null) {
      const operation = match[1] as 'list' | 'read' | 'write' | 'overwrite' | 'delete' | 'create_directory';
      const relativePath = match[2];
      const content = match[3];
      
      const req = {
        entiId: request.entiId,
        operation,
        relativePath,
        content
      };
      const descriptor = getDefaultWorkspaceDescriptor();
      const res = await localFileToolExecutor(req, descriptor, nodeFileSystemAdapter, true); // true = skip confirmation for now to make it work seamlessly
      
      if ((res as any).success) {
        finalResponseText = finalResponseText.replace(match[0], `[✅ Sistema de Archivos: ${operation} en ${relativePath} ejecutado con éxito]`);
      } else {
        finalResponseText = finalResponseText.replace(match[0], `[❌ Error de Sistema de Archivos: ${(res as any).reason || (res as any).message}]`);
      }
    }

    // Fallback para atrapar alucinaciones de 'sandbox:' de OpenAI de cualquier forma
    const sandboxRegex = /(?:\[([^\]]+)\]\(\s*)?(sandbox:\/[^)\s"']+\.(docx|pdf|html))(?:\s*\))?/g;
    let match2;
    while ((match2 = sandboxRegex.exec(finalResponseText)) !== null) {
      const urlMatches = match2[2];
      const ext = match2[3];
      const textName = match2[1] || urlMatches.split('/').pop() || `documento.${ext}`;
      const filename = textName.endsWith(`.${ext}`) ? textName : `${textName}.${ext}`;
      
      if (ext === 'docx') {
        const res = await docxGenerationToolExecutor.execute({ toolId: 'tool-gen-docx', entiId: request.entiId, filename, content: providerResult.responseText || '' });
        if (res.status === 'success') {
          finalResponseText = finalResponseText.replace(match2[0], `[Descargar ${filename}](${filename})`);
        } else {
          finalResponseText = finalResponseText.replace(match2[0], `[⚠️ Error: La herramienta DOCX está desactivada. Actívala en el panel]`);
        }
      } else if (ext === 'pdf') {
        const res = await pdfGenerationToolExecutor.execute({ toolId: 'tool-gen-pdf', entiId: request.entiId, filename, content: providerResult.responseText || '' });
        if (res.status === 'success') {
          finalResponseText = finalResponseText.replace(match2[0], `[Descargar ${filename}](${filename})`);
        } else {
          finalResponseText = finalResponseText.replace(match2[0], `[⚠️ Error: La herramienta PDF está desactivada. Actívala en el panel]`);
        }
      } else if (ext === 'html') {
        const res = await htmlGenerationToolExecutor.execute({ toolId: 'tool-gen-html', entiId: request.entiId, filename, htmlContent: providerResult.responseText || '' });
        if (res.status === 'success') {
          finalResponseText = finalResponseText.replace(match2[0], `[Descargar ${filename}](${filename})`);
        } else {
          finalResponseText = finalResponseText.replace(match2[0], `[⚠️ Error: La herramienta HTML está desactivada. Actívala en el panel]`);
        }
      }
    }
  }

  return {
    status: 'executed',
    executionId: `exec-${Date.now()}`,
    entiId: request.entiId,
    chatId: request.chatId,
    contextId: contextResult.contextId,
    brainId: contextResult.activeBrain?.mode,
    responseText: finalResponseText
  };
}
