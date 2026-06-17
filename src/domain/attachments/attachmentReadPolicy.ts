import type { Attachment } from './attachmentModel';
import type { AttachmentReadError } from './attachmentContextContent';

export const ATTACHMENT_READ_POLICY = {
  MAX_SIZE_BYTES: 1024 * 1024 * 5, // 5MB
  SUPPORTED_EXTENSIONS: ['txt', 'md', 'csv', 'json', 'ts', 'tsx', 'js', 'html', 'pdf', 'docx'],
  SUPPORTED_MIME_TYPES: [
    'text/plain', 
    'text/markdown', 
    'text/csv', 
    'application/json', 
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/javascript',
    'text/html'
  ],
};

export function validateAttachmentReadPolicy(attachment: Attachment): { isReadable: boolean; error?: AttachmentReadError; reason?: string } {
  if (attachment.status !== 'received' && attachment.status !== 'readable') {
    return { isReadable: false, error: 'unavailable_file', reason: 'Archivo no disponible' };
  }
  
  if (attachment.sizeBytes && attachment.sizeBytes > ATTACHMENT_READ_POLICY.MAX_SIZE_BYTES) {
    return { isReadable: false, error: 'size_limit_exceeded', reason: 'El archivo excede el tamaño máximo permitido' };
  }
  
  const ext = attachment.fileExtension?.toLowerCase();
  const mime = attachment.mimeType?.toLowerCase();
  
  const isSupportedExt = ext ? ATTACHMENT_READ_POLICY.SUPPORTED_EXTENSIONS.includes(ext) : false;
  const isSupportedMime = mime ? ATTACHMENT_READ_POLICY.SUPPORTED_MIME_TYPES.includes(mime) : false;
  
  if (!isSupportedExt && !isSupportedMime) {
    return { isReadable: false, error: 'unsupported_type', reason: 'Tipo de archivo no soportado para lectura de texto' };
  }
  
  return { isReadable: true };
}
