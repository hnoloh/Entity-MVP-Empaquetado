/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { validateAttachmentReadPolicy } from '../attachmentReadPolicy';
import type { Attachment } from '../attachmentModel';

describe('attachmentReadPolicy', () => {
  const baseAttachment: Attachment = {
    attachmentId: 'att-1',
    ownerType: 'enti',
    ownerId: 'enti-1',
    chatId: 'chat-1',
    fileName: 'test.pdf',
    fileExtension: 'pdf',
    status: 'received',
    source: 'user_upload',
    receivedAt: '2023-01-01T00:00:00Z',
    sizeBytes: 1024
  } as any;

  it('permite leer archivos validos', () => {
    const result = validateAttachmentReadPolicy(baseAttachment);
    expect(result.isReadable).toBe(true);
  });

  it('bloquea archivos demasiado grandes', () => {
    const hugeAttachment = { ...baseAttachment, sizeBytes: 10 * 1024 * 1024 }; // 10MB
    const result = validateAttachmentReadPolicy(hugeAttachment);
    expect(result.isReadable).toBe(false);
    expect(result.error).toBe('size_limit_exceeded');
  });

  it('bloquea extensiones no soportadas', () => {
    const exeAttachment = { ...baseAttachment, fileExtension: 'exe', mimeType: 'application/x-msdownload' };
    const result = validateAttachmentReadPolicy(exeAttachment as any);
    expect(result.isReadable).toBe(false);
    expect(result.error).toBe('unsupported_type');
  });

  it('bloquea adjuntos no disponibles', () => {
    const errorAttachment = { ...baseAttachment, status: 'error' as const };
    const result = validateAttachmentReadPolicy(errorAttachment);
    expect(result.isReadable).toBe(false);
    expect(result.error).toBe('unavailable_file');
  });

  it('permite leer mediante mimeType aunque no tenga extension', () => {
    const noExtAttachment = { ...baseAttachment, fileExtension: undefined, mimeType: 'text/plain' };
    const result = validateAttachmentReadPolicy(noExtAttachment as any);
    expect(result.isReadable).toBe(true);
  });
});
