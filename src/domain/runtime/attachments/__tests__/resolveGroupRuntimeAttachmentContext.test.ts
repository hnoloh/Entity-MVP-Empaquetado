import { describe, it, expect } from 'vitest';
import { resolveGroupRuntimeAttachmentContext } from '../resolveGroupRuntimeAttachmentContext';
import type { Attachment } from '../../../attachments';

describe('resolveGroupRuntimeAttachmentContext', () => {
  const mockAdapter = async (id: string) => `Simulated content for ${id}`;

  const baseAttachment: Attachment = {
    attachmentId: 'att-1',
    ownerType: 'group',
    ownerId: 'group-1',
    chatId: 'chat-1',
    fileName: 'test.txt',
    fileExtension: 'txt',
    status: 'received',
    source: 'user_upload',
    receivedAt: '2023-01-01T00:00:00Z',
    sizeBytes: 1024
  };

  it('empty: Chat de Grupo sin adjuntos devuelve contexto vacío válido', async () => {
    const ctx = await resolveGroupRuntimeAttachmentContext({ ownerId: 'group-1', chatId: 'chat-1', attachments: [] }, mockAdapter);
    expect(ctx.ownerType).toBe('group');
    expect(ctx.items.length).toBe(0);
    expect(ctx.errors!.length).toBe(0);
  });

  it('resolve: Chat de Grupo con adjunto válido devuelve contexto de adjunto', async () => {
    const ctx = await resolveGroupRuntimeAttachmentContext({ ownerId: 'group-1', chatId: 'chat-1', attachments: [baseAttachment] }, mockAdapter);
    expect(ctx.items.length).toBe(1);
    expect(ctx.errors!.length).toBe(0);
    expect(ctx.items[0].status).toBe('success');
    expect(ctx.items[0].contentText).toBe('Simulated content for att-1');
  });

  it('isolation-owner: adjunto de otro Grupo queda bloqueado', async () => {
    const attOtherOwner = { ...baseAttachment, ownerId: 'group-2' };
    const ctx = await resolveGroupRuntimeAttachmentContext({ ownerId: 'group-1', chatId: 'chat-1', attachments: [attOtherOwner] }, mockAdapter);
    expect(ctx.items.length).toBe(0);
    expect(ctx.errors!.length).toBe(1);
    expect(ctx.errors![0].status).toBe('blocked');
    expect(ctx.errors![0].reason).toContain('Mismatch de owner/chat');
  });

  it('isolation-chat: adjunto de otro chat queda bloqueado', async () => {
    const attOtherChat = { ...baseAttachment, chatId: 'chat-2' };
    const ctx = await resolveGroupRuntimeAttachmentContext({ ownerId: 'group-1', chatId: 'chat-1', attachments: [attOtherChat] }, mockAdapter);
    expect(ctx.items.length).toBe(0);
    expect(ctx.errors!.length).toBe(1);
    expect(ctx.errors![0].status).toBe('blocked');
    expect(ctx.errors![0].reason).toContain('Mismatch de owner/chat');
  });

  it('reject-enti: ownerType enti queda bloqueado', async () => {
    const entiAtt: Attachment = { ...baseAttachment, ownerType: 'enti', ownerId: 'enti-1' };
    const ctx = await resolveGroupRuntimeAttachmentContext({ ownerId: 'group-1', chatId: 'chat-1', attachments: [entiAtt] }, mockAdapter);
    expect(ctx.items.length).toBe(0);
    expect(ctx.errors![0].status).toBe('blocked');
    expect(ctx.errors![0].reason).toContain('uso de adjuntos de Enti no está permitido');
  });

  it('deterministic-order: ordena por fecha', async () => {
    const attA = { ...baseAttachment, attachmentId: 'A', receivedAt: '2023-01-02T00:00:00Z' };
    const attB = { ...baseAttachment, attachmentId: 'B', receivedAt: '2023-01-01T00:00:00Z' };
    const ctx = await resolveGroupRuntimeAttachmentContext({ ownerId: 'group-1', chatId: 'chat-1', attachments: [attA, attB] }, mockAdapter);
    expect(ctx.items[0].attachmentId).toBe('B');
    expect(ctx.items[1].attachmentId).toBe('A');
  });

  it('controlled-error: falla de adapter genera error controlado sin romper array', async () => {
    const failAdapter = async () => null;
    const ctx = await resolveGroupRuntimeAttachmentContext({ ownerId: 'group-1', chatId: 'chat-1', attachments: [baseAttachment] }, failAdapter);
    expect(ctx.items.length).toBe(0);
    expect(ctx.errors![0].status).toBe('controlled_error');
    expect(ctx.errors![0].errorCode).toBe('unavailable_file');
  });
});
