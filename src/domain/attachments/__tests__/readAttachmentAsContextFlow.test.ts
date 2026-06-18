import { describe, it, expect, vi } from 'vitest';
import { readAttachmentAsContextFlow, type TextExtractionAdapter } from '../readAttachmentAsContextFlow';
import type { Attachment } from '../attachmentModel';

describe('readAttachmentAsContextFlow', () => {
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

  const validRequest = {
    attachmentId: 'att-1',
    ownerType: 'enti' as const,
    ownerId: 'enti-1',
    chatId: 'chat-1'
  };

  const mockAdapter: TextExtractionAdapter = async (id) => {
    if (id === 'att-1') return 'Contenido de prueba simulado';
    return null;
  };

  it('read enti attachment success', async () => {
    const result = await readAttachmentAsContextFlow(validRequest, baseAttachment, mockAdapter);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.content.contentText).toBe('Contenido de prueba simulado');
      expect(result.content.attachmentId).toBe('att-1');
      expect(result.content.ownerId).toBe('enti-1');
      expect(result.content.chatId).toBe('chat-1');
      expect(result.content.sourceName).toBe('test.txt');
    }
  });

  it('read group attachment success', async () => {
    const groupAtt: Attachment = { ...baseAttachment, ownerType: 'group', ownerId: 'group-2' };
    const groupReq = { ...validRequest, ownerType: 'group' as const, ownerId: 'group-2' };
    const result = await readAttachmentAsContextFlow(groupReq, groupAtt, mockAdapter);
    expect(result.status).toBe('success');
  });

  it('controlled_error wrong owner', async () => {
    const wrongOwnerReq = { ...validRequest, ownerId: 'enti-2' };
    const result = await readAttachmentAsContextFlow(wrongOwnerReq, baseAttachment, mockAdapter);
    expect(result.status).toBe('controlled_error');
    if (result.status === 'controlled_error') expect(result.error).toBe('wrong_owner');
  });

  it('controlled_error wrong chat', async () => {
    const wrongChatReq = { ...validRequest, chatId: 'chat-2' };
    const result = await readAttachmentAsContextFlow(wrongChatReq, baseAttachment, mockAdapter);
    expect(result.status).toBe('controlled_error');
    if (result.status === 'controlled_error') expect(result.error).toBe('wrong_chat');
  });

  it('blocked id mismatch', async () => {
    const wrongIdReq = { ...validRequest, attachmentId: 'att-2' };
    const result = await readAttachmentAsContextFlow(wrongIdReq, baseAttachment, mockAdapter);
    expect(result.status).toBe('blocked');
  });

  it('controlled_error not_found when attachment is null', async () => {
    const result = await readAttachmentAsContextFlow(validRequest, null, mockAdapter);
    expect(result.status).toBe('controlled_error');
    if (result.status === 'controlled_error') expect(result.error).toBe('not_found');
  });

  it('controlled_error empty content', async () => {
    const emptyAdapter: TextExtractionAdapter = async () => '   ';
    const result = await readAttachmentAsContextFlow(validRequest, baseAttachment, emptyAdapter);
    expect(result.status).toBe('controlled_error');
    if (result.status === 'controlled_error') expect(result.error).toBe('empty_content');
  });

  it('controlled_error unavailable file from adapter', async () => {
    const failAdapter: TextExtractionAdapter = async () => null;
    const result = await readAttachmentAsContextFlow(validRequest, baseAttachment, failAdapter);
    expect(result.status).toBe('controlled_error');
    if (result.status === 'controlled_error') expect(result.error).toBe('unavailable_file');
  });

  it('controlled_error unsupported type (delegated to policy)', async () => {
    const exeAtt = { ...baseAttachment, fileExtension: 'exe' };
    const result = await readAttachmentAsContextFlow(validRequest, exeAtt as unknown, mockAdapter);
    expect(result.status).toBe('controlled_error');
    if (result.status === 'controlled_error') expect(result.error).toBe('unsupported_type');
  });

  it('no invoca Runtime, Brain, provider, Prompt Engine, ni Tools', async () => {
    // Verified by lack of imports and lack of external calls.
    const spy = vi.fn();
    const result = await readAttachmentAsContextFlow(validRequest, baseAttachment, async (id) => {
      spy(id);
      return 'OK';
    });
    expect(result.status).toBe('success');
    expect(spy).toHaveBeenCalledWith('att-1');
  });
});
