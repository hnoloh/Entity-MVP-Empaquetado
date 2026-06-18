import type { Attachment } from '../../domain/attachments/attachmentModel';

export interface ChatAttachmentViewModel {
  id: string;
  chatId: string;
  name: string;
  extension: string;
  mimeType: string;
  sizeFormatted: string;
  status: 'renderizable' | 'blocked' | 'controlled_error' | 'unavailable_metadata';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function mapAttachmentRecordToChatAttachmentViewModel(attachment: Attachment): ChatAttachmentViewModel {
  let status: ChatAttachmentViewModel['status'];
  
  if (!attachment.fileName || !attachment.fileExtension) {
    status = 'unavailable_metadata';
  } else if (attachment.status === 'error') {
    status = 'controlled_error';
  } else if (attachment.status === 'unsupported') {
    status = 'blocked';
  } else {
    status = 'renderizable';
  }

  return {
    id: attachment.attachmentId,
    chatId: attachment.chatId,
    name: attachment.fileName || 'Archivo desconocido',
    extension: attachment.fileExtension || '',
    mimeType: attachment.mimeType || 'application/octet-stream',
    sizeFormatted: attachment.sizeBytes ? formatBytes(attachment.sizeBytes) : 'Tamaño desconocido',
    status
  };
}
