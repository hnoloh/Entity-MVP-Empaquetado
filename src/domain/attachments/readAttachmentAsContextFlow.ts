import type { Attachment } from './attachmentModel';
import type { AttachmentContextContent, AttachmentReadError } from './attachmentContextContent';
import { validateAttachmentReadPolicy } from './attachmentReadPolicy';

export interface ReadAttachmentAsContextRequest {
  attachmentId: string;
  ownerType: 'enti' | 'group';
  ownerId: string;
  chatId: string;
}

export type ReadAttachmentAsContextResult = 
  | { status: 'success'; content: AttachmentContextContent }
  | { status: 'blocked'; reason: string }
  | { status: 'controlled_error'; error: AttachmentReadError; reason: string };

export type TextExtractionAdapter = (attachmentId: string) => Promise<string | null>;

export async function readAttachmentAsContextFlow(
  request: ReadAttachmentAsContextRequest,
  attachment: Attachment | undefined | null,
  adapter: TextExtractionAdapter
): Promise<ReadAttachmentAsContextResult> {
  if (!attachment) {
    return { status: 'controlled_error', error: 'not_found', reason: 'Adjunto no encontrado' };
  }

  if (attachment.attachmentId !== request.attachmentId) {
     return { status: 'blocked', reason: 'El ID del adjunto no coincide' };
  }
  if (attachment.ownerId !== request.ownerId || attachment.ownerType !== request.ownerType) {
     return { status: 'controlled_error', error: 'wrong_owner', reason: 'El adjunto no pertenece a este owner' };
  }
  if (attachment.chatId !== request.chatId) {
     return { status: 'controlled_error', error: 'wrong_chat', reason: 'El adjunto no pertenece a este chat' };
  }

  const policyCheck = validateAttachmentReadPolicy(attachment);
  if (!policyCheck.isReadable) {
     return { status: 'controlled_error', error: policyCheck.error!, reason: policyCheck.reason! };
  }

  let text: string | null = null;
  try {
    text = await adapter(attachment.attachmentId);
  } catch (err: any) {
    return { status: 'controlled_error', error: 'unavailable_file', reason: err.message || 'Error del adaptador al extraer texto' };
  }

  if (text === null) {
     return { status: 'controlled_error', error: 'unavailable_file', reason: 'No se pudo extraer texto del adjunto' };
  }
  if (text.trim() === '') {
     return { status: 'controlled_error', error: 'empty_content', reason: 'El archivo está vacío' };
  }

  return {
    status: 'success',
    content: {
      attachmentId: attachment.attachmentId,
      ownerType: attachment.ownerType,
      ownerId: attachment.ownerId,
      chatId: attachment.chatId,
      sourceName: attachment.fileName,
      contentText: text
    }
  };
}
