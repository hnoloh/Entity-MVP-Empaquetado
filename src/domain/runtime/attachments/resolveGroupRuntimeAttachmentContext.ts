import type { Attachment, TextExtractionAdapter } from '../../attachments';
import { readAttachmentAsContextFlow } from '../../attachments';
import type { GroupRuntimeAttachmentContext } from './groupRuntimeAttachmentContextTypes';
import { buildGroupAttachmentRuntimeContext } from './buildGroupAttachmentRuntimeContext';

export interface ResolveGroupRuntimeContextRequest {
  ownerId: string;
  chatId: string;
  attachments: Attachment[];
}

export async function resolveGroupRuntimeAttachmentContext(
  request: ResolveGroupRuntimeContextRequest,
  adapter: TextExtractionAdapter
): Promise<GroupRuntimeAttachmentContext> {
  const context: GroupRuntimeAttachmentContext = {
    ownerType: 'group',
    ownerId: request.ownerId,
    chatId: request.chatId,
    items: [],
    errors: [],
    status: 'success'
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
    // Filtrar ownerType = enti
    if (attachment.ownerType === 'enti') {
      context.errors!.push({
        attachmentId: attachment.attachmentId,
        status: 'blocked',
        reason: 'El uso de adjuntos de Enti no está permitido en Runtime Grupo'
      });
      continue;
    }

    // Filtrar mismatches estructurales para no llamar al flujo inutilmente
    if (attachment.ownerType !== 'group' || attachment.ownerId !== request.ownerId || attachment.chatId !== request.chatId) {
      context.errors!.push({
        attachmentId: attachment.attachmentId,
        status: 'blocked',
        reason: 'Mismatch de owner/chat (Isolation Breach Prevented)'
      });
      continue;
    }

    // Usar contrato de dominio base
    const readReq = {
      attachmentId: attachment.attachmentId,
      ownerType: 'group' as const,
      ownerId: request.ownerId,
      chatId: request.chatId
    };

    const readResult = await readAttachmentAsContextFlow(readReq, attachment, adapter);
    const { item, error } = buildGroupAttachmentRuntimeContext(attachment.attachmentId, request.ownerId, request.chatId, readResult);
    
    if (item) {
      context.items.push(item);
    }
    if (error) {
      context.errors!.push(error);
    }
  }

  if (context.errors!.length > 0 && context.items.length === 0) {
    context.status = context.errors!.some(e => e.status === 'blocked') ? 'blocked' : 'controlled_error';
  }

  return context;
}
