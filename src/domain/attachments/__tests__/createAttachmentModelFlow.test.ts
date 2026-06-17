import { describe, it, expect } from 'vitest';
import { createAttachmentModelFlow } from '../createAttachmentModelFlow';
import type { AttachmentModelRequest } from '../attachmentModel';

describe('createAttachmentModelFlow', () => {
  it('should return success for valid pdf', () => {
    const request: AttachmentModelRequest = {
      explicitUserAction: true,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'document.pdf',
      fileExtension: 'pdf'
    };
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('success');
    expect(result.attachment?.fileExtension).toBe('pdf');
    expect(result.attachment?.status).toBe('received');
  });

  it('should return success for valid docx', () => {
    const request: AttachmentModelRequest = {
      explicitUserAction: true,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'doc.docx',
      fileExtension: 'docx'
    };
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('success');
  });

  it('should return success for valid odt', () => {
    const request: AttachmentModelRequest = {
      explicitUserAction: true,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'doc.odt',
      fileExtension: 'odt'
    };
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('success');
  });

  it('should return success for valid md', () => {
    const request: AttachmentModelRequest = {
      explicitUserAction: true,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'doc.md',
      fileExtension: 'md'
    };
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('success');
  });

  it('should return success for valid json', () => {
    const request: AttachmentModelRequest = {
      explicitUserAction: true,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'data.json',
      fileExtension: 'json'
    };
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('success');
  });

  it('should return success for valid txt', () => {
    const request: AttachmentModelRequest = {
      explicitUserAction: true,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'text.txt',
      fileExtension: 'txt'
    };
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('success');
  });

  it('should return blocked if explicitUserAction is false', () => {
    const request: AttachmentModelRequest = {
      explicitUserAction: false,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'document.pdf',
      fileExtension: 'pdf'
    };
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.reason).toContain('explicitUserAction');
  });

  it('should return controlled_error without ownerType', () => {
    const request = {
      explicitUserAction: true,
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'document.pdf',
      fileExtension: 'pdf'
    } as unknown as AttachmentModelRequest;
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.reason).toContain('ownerType');
  });

  it('should return controlled_error without ownerId', () => {
    const request: AttachmentModelRequest = {
      explicitUserAction: true,
      ownerType: 'enti',
      ownerId: '',
      chatId: 'chat-1',
      fileName: 'document.pdf',
      fileExtension: 'pdf'
    };
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.reason).toContain('ownerId');
  });

  it('should return controlled_error without chatId', () => {
    const request: AttachmentModelRequest = {
      explicitUserAction: true,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: '',
      fileName: 'document.pdf',
      fileExtension: 'pdf'
    };
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.reason).toContain('chatId');
  });

  it('should return controlled_error with empty fileName', () => {
    const request: AttachmentModelRequest = {
      explicitUserAction: true,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: '   ',
      fileExtension: 'pdf'
    };
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.reason).toContain('fileName');
  });

  it('should return controlled_error for unsupported extension', () => {
    const extensions = ['exe', 'zip', 'mp4', 'png', 'csv'];
    for (const ext of extensions) {
      const request: AttachmentModelRequest = {
        explicitUserAction: true,
        ownerType: 'enti',
        ownerId: 'enti-1',
        chatId: 'chat-1',
        fileName: `file.${ext}`,
        fileExtension: ext
      };
      const result = createAttachmentModelFlow(request);
      expect(result.status).toBe('controlled_error');
      expect(result.reason).toContain('Unsupported file extension');
    }
  });

  it('should return controlled_error for invalid owner global or multiple', () => {
    const request = {
      explicitUserAction: true,
      ownerType: 'global',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'document.pdf',
      fileExtension: 'pdf'
    } as unknown as AttachmentModelRequest;
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.reason).toContain('ownerType');
  });

  it('should not mutate the input request', () => {
    const request: AttachmentModelRequest = {
      explicitUserAction: true,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'document.pdf',
      fileExtension: 'pdf'
    };
    const requestCopy = { ...request };
    createAttachmentModelFlow(request);
    expect(request).toEqual(requestCopy);
  });

  it('should not contain absolute paths or contents', () => {
    const request: AttachmentModelRequest = {
      explicitUserAction: true,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'document.pdf',
      fileExtension: 'pdf'
    };
    const result = createAttachmentModelFlow(request);
    expect(result.status).toBe('success');
    expect(result.attachment).not.toHaveProperty('path');
    expect(result.attachment).not.toHaveProperty('content');
    expect(result.attachment).not.toHaveProperty('blob');
  });
});
