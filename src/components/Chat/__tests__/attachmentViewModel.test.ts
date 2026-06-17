import { describe, it, expect } from 'vitest';
import { mapAttachmentRecordToChatAttachmentViewModel } from '../attachmentViewModel';
import { Attachment } from '../../../domain/attachments/attachmentModel';

describe('attachmentViewModel', () => {
  it('maps correctly received attachment to renderizable', () => {
    const attachment: Attachment = {
      attachmentId: 'att-1',
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'test.pdf',
      fileExtension: 'pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1048576, // 1 MB
      receivedAt: new Date().toISOString(),
      status: 'received',
      source: 'user_upload'
    };
    
    const vm = mapAttachmentRecordToChatAttachmentViewModel(attachment);
    
    expect(vm.id).toBe('att-1');
    expect(vm.chatId).toBe('chat-1');
    expect(vm.name).toBe('test.pdf');
    expect(vm.extension).toBe('pdf');
    expect(vm.sizeFormatted).toBe('1 MB');
    expect(vm.status).toBe('renderizable');
  });

  it('handles missing filename as unavailable_metadata', () => {
    const attachment: any = {
      attachmentId: 'att-2',
      chatId: 'chat-2',
      status: 'received'
    };
    
    const vm = mapAttachmentRecordToChatAttachmentViewModel(attachment);
    expect(vm.status).toBe('unavailable_metadata');
  });

  it('maps unsupported status to blocked', () => {
    const attachment: Attachment = {
      attachmentId: 'att-1',
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'test.exe',
      fileExtension: 'txt', // Fake extension for test
      mimeType: 'application/octet-stream',
      receivedAt: new Date().toISOString(),
      status: 'unsupported',
      source: 'user_upload'
    };
    
    const vm = mapAttachmentRecordToChatAttachmentViewModel(attachment);
    expect(vm.status).toBe('blocked');
  });

  it('formats bytes correctly', () => {
    const attachment: Attachment = {
      attachmentId: 'att-1',
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'doc.md',
      fileExtension: 'md',
      sizeBytes: 1536,
      receivedAt: new Date().toISOString(),
      status: 'received',
      source: 'user_upload'
    };
    
    const vm = mapAttachmentRecordToChatAttachmentViewModel(attachment);
    expect(vm.sizeFormatted).toBe('1.5 KB');
  });
});
