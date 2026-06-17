import { describe, it, expect } from 'vitest';
import { resolveEntiRuntimeAttachmentContext } from '../resolveEntiRuntimeAttachmentContext';
import type { Attachment } from '../../../attachments';

describe('resolveEntiRuntimeAttachmentContext', () => {
  const mockAdapter = async (id: string) => `Simulated content for ${id}`;

  const baseAttachment: Attachment = {
    attachmentId: 'att-1',
    ownerType: 'enti',
    ownerId: 'enti-1',
    chatId: 'chat-1',
    fileName: 'test.txt',
    fileExtension: 'txt',
    status: 'received',
    source: 'user_upload',
    receivedAt: '2023-01-01T00:00:00Z',
    sizeBytes: 1024
  };

  it('empty: Chat de Enti sin adjuntos devuelve contexto vacío válido', async () => {
    const ctx = await resolveEntiRuntimeAttachmentContext({ ownerId: 'enti-1', chatId: 'chat-1', attachments: [] }, mockAdapter);
    expect(ctx.ownerType).toBe('enti');
    expect(ctx.blocks.length).toBe(0);
  });

  it('resolve: Chat de Enti con adjunto válido devuelve contexto de adjunto', async () => {
    const ctx = await resolveEntiRuntimeAttachmentContext({ ownerId: 'enti-1', chatId: 'chat-1', attachments: [baseAttachment] }, mockAdapter);
    expect(ctx.blocks.length).toBe(1);
    expect(ctx.blocks[0].status).toBe('success');
    expect(ctx.blocks[0].content?.contentText).toBe('Simulated content for att-1');
  });

  it('isolation-owner: adjunto de otro Enti queda bloqueado', async () => {
    const attOtherOwner = { ...baseAttachment, ownerId: 'enti-2' };
    const ctx = await resolveEntiRuntimeAttachmentContext({ ownerId: 'enti-1', chatId: 'chat-1', attachments: [attOtherOwner] }, mockAdapter);
    expect(ctx.blocks.length).toBe(1);
    expect(ctx.blocks[0].status).toBe('blocked');
    expect(ctx.blocks[0].reason).toContain('Mismatch de owner/chat');
  });

  it('isolation-chat: adjunto de otro chat queda bloqueado', async () => {
    const attOtherChat = { ...baseAttachment, chatId: 'chat-2' };
    const ctx = await resolveEntiRuntimeAttachmentContext({ ownerId: 'enti-1', chatId: 'chat-1', attachments: [attOtherChat] }, mockAdapter);
    expect(ctx.blocks.length).toBe(1);
    expect(ctx.blocks[0].status).toBe('blocked');
    expect(ctx.blocks[0].reason).toContain('Mismatch de owner/chat');
  });

  it('reject-group: ownerType group queda bloqueado', async () => {
    const groupAtt: Attachment = { ...baseAttachment, ownerType: 'group', ownerId: 'group-1' };
    const ctx = await resolveEntiRuntimeAttachmentContext({ ownerId: 'enti-1', chatId: 'chat-1', attachments: [groupAtt] }, mockAdapter);
    expect(ctx.blocks[0].status).toBe('blocked');
    expect(ctx.blocks[0].reason).toContain('adjuntos de grupo no está permitido');
  });

  it('deterministic-order: ordena por fecha', async () => {
    const attA = { ...baseAttachment, attachmentId: 'A', receivedAt: '2023-01-02T00:00:00Z' };
    const attB = { ...baseAttachment, attachmentId: 'B', receivedAt: '2023-01-01T00:00:00Z' };
    const ctx = await resolveEntiRuntimeAttachmentContext({ ownerId: 'enti-1', chatId: 'chat-1', attachments: [attA, attB] }, mockAdapter);
    expect(ctx.blocks[0].attachmentId).toBe('B');
    expect(ctx.blocks[1].attachmentId).toBe('A');
  });

  it('controlled-error: falla de adapter genera bloque controlled_error y no rompe', async () => {
    const failAdapter = async () => null;
    const ctx = await resolveEntiRuntimeAttachmentContext({ ownerId: 'enti-1', chatId: 'chat-1', attachments: [baseAttachment] }, failAdapter);
    expect(ctx.blocks[0].status).toBe('controlled_error');
    expect(ctx.blocks[0].errorType).toBe('unavailable_file');
  });
});
