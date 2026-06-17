import type { Attachment, TextExtractionAdapter } from '../../attachments';
import { readAttachmentAsContextFlow } from '../../attachments';
import type { EntiRuntimeAttachmentContext } from './entiRuntimeAttachmentContextTypes';
import { buildEntiAttachmentRuntimeContext } from './buildEntiAttachmentRuntimeContext';

export interface ResolveEntiRuntimeContextRequest {
  ownerId: string;
  chatId: string;
  attachments: Attachment[];
}

export async function resolveEntiRuntimeAttachmentContext(
  request: ResolveEntiRuntimeContextRequest,
  adapter: TextExtractionAdapter
): Promise<EntiRuntimeAttachmentContext> {
  const context: EntiRuntimeAttachmentContext = {
    ownerType: 'enti',
    ownerId: request.ownerId,
    chatId: request.chatId,
    blocks: []
  };

  if (!request.attachments || request.attachments.length === 0) {
    return context;
  }

  // Ordenar determinísticamente: por receivedAt si existe, si no por ID
  const sortedAttachments = [...request.attachments].sort((a, b) => {
    const timeA = a.receivedAt ? new Date(a.receivedAt).getTime() : 0;
    const timeB = b.receivedAt ? new Date(b.receivedAt).getTime() : 0;
    if (timeA === timeB) return a.attachmentId.localeCompare(b.attachmentId);
    return timeA - timeB;
  });

  for (const attachment of sortedAttachments) {
    // Filtrar ownerType = group
    if (attachment.ownerType === 'group') {
      context.blocks.push({
        attachmentId: attachment.attachmentId,
        status: 'blocked',
        reason: 'El uso de adjuntos de grupo no está permitido en Runtime Enti'
      });
      continue;
    }

    // Filtrar mismatches estructurales para no llamar al flujo inutilmente
    if (attachment.ownerType !== 'enti' || attachment.ownerId !== request.ownerId || attachment.chatId !== request.chatId) {
      context.blocks.push({
        attachmentId: attachment.attachmentId,
        status: 'blocked',
        reason: 'Mismatch de owner/chat (Isolation Breach Prevented)'
      });
      continue;
    }

    // Usar contrato de dominio base
    const readReq = {
      attachmentId: attachment.attachmentId,
      ownerType: 'enti' as const,
      ownerId: request.ownerId,
      chatId: request.chatId
    };

    const readResult = await readAttachmentAsContextFlow(readReq, attachment, adapter);
    const block = buildEntiAttachmentRuntimeContext(attachment.attachmentId, readResult);
    context.blocks.push(block);
  }

  return context;
}
