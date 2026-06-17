import { describe, it, expect } from 'vitest';
import { associateAttachmentToGroupChatFlow } from '../associateAttachmentToGroupChatFlow';
import type { AssociateAttachmentToGroupChatRequest } from '../associateAttachmentToGroupChatFlow';
import type { Attachment } from '../attachmentModel';

describe('associateAttachmentToGroupChatFlow', () => {
  const validAttachment: Attachment = {
    attachmentId: 'att-group-123',
    ownerType: 'group',
    ownerId: 'group-1',
    chatId: 'chat-group-1',
    fileName: 'test.pdf',
    fileExtension: 'pdf',
    receivedAt: '2023-01-01T00:00:00Z',
    status: 'received',
    source: 'user_upload'
  };

  it('should return success with a valid association', () => {
    const request: AssociateAttachmentToGroupChatRequest = {
      attachment: validAttachment,
      ownerType: 'group',
      ownerId: 'group-1',
      chatId: 'chat-group-1'
    };

    const result = associateAttachmentToGroupChatFlow(request);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.association.attachmentId).toBe('att-group-123');
      expect(result.association.ownerType).toBe('group');
      expect(result.association.ownerId).toBe('group-1');
      expect(result.association.chatId).toBe('chat-group-1');
      expect(result.association.status).toBe('attached');
    }
  });

  it('should reject ownerType="enti" as blocked', () => {
    const request: AssociateAttachmentToGroupChatRequest = {
      attachment: validAttachment,
      ownerType: 'enti',
      ownerId: 'group-1',
      chatId: 'chat-group-1'
    };

    const result = associateAttachmentToGroupChatFlow(request);
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') {
      expect(result.reason).toContain('ownerType must be group');
    }
  });

  it('should reject missing ownerId as blocked', () => {
    const request: AssociateAttachmentToGroupChatRequest = {
      attachment: validAttachment,
      ownerType: 'group',
      ownerId: '',
      chatId: 'chat-group-1'
    };

    const result = associateAttachmentToGroupChatFlow(request);
    expect(result.status).toBe('blocked');
  });

  it('should reject missing chatId as blocked', () => {
    const request: AssociateAttachmentToGroupChatRequest = {
      attachment: validAttachment,
      ownerType: 'group',
      ownerId: 'group-1',
      chatId: ''
    };

    const result = associateAttachmentToGroupChatFlow(request);
    expect(result.status).toBe('blocked');
  });

  it('should reject chatId that belongs to another group as blocked', () => {
    const request: AssociateAttachmentToGroupChatRequest = {
      attachment: validAttachment,
      ownerType: 'group',
      ownerId: 'group-1',
      chatId: 'chat-group-1',
      chatOwnerId: 'group-2'
    };

    const result = associateAttachmentToGroupChatFlow(request);
    expect(result.status).toBe('blocked');
  });

  it('should reject enti chat as destination as blocked', () => {
    const request: AssociateAttachmentToGroupChatRequest = {
      attachment: validAttachment,
      ownerType: 'group',
      ownerId: 'group-1',
      chatId: 'chat-group-1',
      chatOwnerType: 'enti'
    };

    const result = associateAttachmentToGroupChatFlow(request);
    expect(result.status).toBe('blocked');
  });

  it('should reject invalid AttachmentModel as controlled_error', () => {
    const request: AssociateAttachmentToGroupChatRequest = {
      attachment: {} as Attachment,
      ownerType: 'group',
      ownerId: 'group-1',
      chatId: 'chat-group-1'
    };

    const result = associateAttachmentToGroupChatFlow(request);
    expect(result.status).toBe('controlled_error');
  });
});
