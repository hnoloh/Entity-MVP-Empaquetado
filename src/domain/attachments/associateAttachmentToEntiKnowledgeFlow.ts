import type { Attachment } from './attachmentModel';

export interface AssociateAttachmentToEntiKnowledgeRequest {
  attachment: Attachment | Record<string, unknown>; // Record to allow checking forbidden physical fields
  ownerId: string;
  ownerType: string;
}

export type AttachmentKnowledgeAssociationResult = 
  | { status: 'success'; attachmentId: string; ownerType: 'enti'; ownerId: string; knowledgeScope: 'enti_knowledge'; metadata?: Record<string, unknown> }
  | { status: 'blocked'; reason: string }
  | { status: 'controlled_error'; reason: string };

export function associateAttachmentToEntiKnowledgeFlow(
  request: AssociateAttachmentToEntiKnowledgeRequest
): AttachmentKnowledgeAssociationResult {
  const { attachment, ownerId, ownerType } = request;

  if (!attachment) {
    return { status: 'controlled_error', reason: 'Adjunto ausente' };
  }

  if (!attachment.attachmentId) {
    return { status: 'blocked', reason: 'Falta attachmentId en el adjunto' };
  }

  if (ownerType !== 'enti' || attachment.ownerType !== 'enti') {
    return { status: 'blocked', reason: 'ownerType debe ser enti' };
  }

  if (!ownerId || ownerId.trim() === '') {
    return { status: 'blocked', reason: 'ownerId ausente o vacío' };
  }

  if (attachment.ownerId !== ownerId) {
    return { status: 'blocked', reason: 'Mismatch de ownerId' };
  }

  // Check for forbidden fields
  const forbiddenFields = ['blob', 'content', 'rawText', 'file', 'arrayBuffer'];
  const hasForbidden = forbiddenFields.some(field => field in attachment && attachment[field] !== undefined);
  
  if (hasForbidden) {
    return { status: 'blocked', reason: 'El adjunto contiene campos de contenido físico prohibidos' };
  }

  return {
    status: 'success',
    attachmentId: attachment.attachmentId,
    ownerType: 'enti',
    ownerId: ownerId,
    knowledgeScope: 'enti_knowledge',
    metadata: attachment.metadata
  };
}
