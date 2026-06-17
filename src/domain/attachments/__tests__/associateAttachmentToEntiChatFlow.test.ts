import { describe, it, expect } from 'vitest';
import { associateAttachmentToEntiChatFlow } from '../associateAttachmentToEntiChatFlow';
import type { AssociateAttachmentToEntiChatRequest } from '../associateAttachmentToEntiChatFlow';
import type { Attachment } from '../attachmentModel';

describe('associateAttachmentToEntiChatFlow', () => {
  const validAttachment: Attachment = {
    attachmentId: 'att-123',
    ownerType: 'enti',
    ownerId: 'enti-1',
    chatId: 'chat-1',
    fileName: 'test.pdf',
    fileExtension: 'pdf',
    receivedAt: '2023-01-01T00:00:00Z',
    status: 'received',
    source: 'user_upload'
  };

  it('should return success with a valid association', () => {
    const request: AssociateAttachmentToEntiChatRequest = {
      attachment: validAttachment,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1'
    };

    const result = associateAttachmentToEntiChatFlow(request);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.association.attachmentId).toBe('att-123');
      expect(result.association.ownerType).toBe('enti');
      expect(result.association.ownerId).toBe('enti-1');
      expect(result.association.chatId).toBe('chat-1');
      expect(result.association.status).toBe('attached');
    }
  });

  it('should preserve attachmentId, ownerType, ownerId and chatId', () => {
    const request: AssociateAttachmentToEntiChatRequest = {
      attachment: validAttachment,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1'
    };

    const result = associateAttachmentToEntiChatFlow(request);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.association.attachmentId).toBe(validAttachment.attachmentId);
      expect(result.association.ownerId).toBe(request.ownerId);
      expect(result.association.chatId).toBe(request.chatId);
    }
  });

  it('should reject ownerType="group"', () => {
    const request: AssociateAttachmentToEntiChatRequest = {
      attachment: validAttachment,
      ownerType: 'group',
      ownerId: 'enti-1',
      chatId: 'chat-1'
    };

    const result = associateAttachmentToEntiChatFlow(request);
    expect(result.status).toBe('controlled_error');
    if (result.status === 'controlled_error') {
      expect(result.reason).toContain('ownerType must be enti');
    }
  });

  it('should reject missing ownerId', () => {
    const request: AssociateAttachmentToEntiChatRequest = {
      attachment: validAttachment,
      ownerType: 'enti',
      ownerId: '',
      chatId: 'chat-1'
    };

    const result = associateAttachmentToEntiChatFlow(request);
    expect(result.status).toBe('controlled_error');
  });

  it('should reject missing chatId', () => {
    const request: AssociateAttachmentToEntiChatRequest = {
      attachment: validAttachment,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: ''
    };

    const result = associateAttachmentToEntiChatFlow(request);
    expect(result.status).toBe('controlled_error');
  });

  it('should reject chatId that belongs to another enti', () => {
    const request: AssociateAttachmentToEntiChatRequest = {
      attachment: validAttachment,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      chatOwnerId: 'enti-2'
    };

    const result = associateAttachmentToEntiChatFlow(request);
    expect(result.status).toBe('controlled_error');
  });

  it('should reject chatId that belongs to group', () => {
    const request: AssociateAttachmentToEntiChatRequest = {
      attachment: validAttachment,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      chatOwnerType: 'group'
    };

    const result = associateAttachmentToEntiChatFlow(request);
    expect(result.status).toBe('controlled_error');
  });

  it('should reject invalid AttachmentModel', () => {
    const request: AssociateAttachmentToEntiChatRequest = {
      attachment: {} as Attachment,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1'
    };

    const result = associateAttachmentToEntiChatFlow(request);
    expect(result.status).toBe('controlled_error');
  });

  it('should reject if explicitUserAction is false', () => {
    const request: AssociateAttachmentToEntiChatRequest = {
      explicitUserAction: false,
      attachment: validAttachment,
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1'
    };

    const result = associateAttachmentToEntiChatFlow(request);
    expect(result.status).toBe('blocked');
  });
});
