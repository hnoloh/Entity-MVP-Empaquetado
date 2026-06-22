/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { associateAttachmentToEntiKnowledgeFlow } from '../associateAttachmentToEntiKnowledgeFlow';
import type { Attachment } from '../attachmentModel';

describe('associateAttachmentToEntiKnowledgeFlow', () => {
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
  };

  it('Asocia adjunto válido a Conocimientos de Enti con resultado success', () => {
    const result = associateAttachmentToEntiKnowledgeFlow({ attachment: baseAttachment, ownerId: 'enti-1', ownerType: 'enti' });
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.attachmentId).toBe('att-1');
      expect(result.ownerType).toBe('enti');
      expect(result.ownerId).toBe('enti-1');
      expect(result.knowledgeScope).toBe('enti_knowledge');
    }
  });

  it('Rechaza ownerType group', () => {
    const result = associateAttachmentToEntiKnowledgeFlow({ attachment: { ...baseAttachment, ownerType: 'group' }, ownerId: 'enti-1', ownerType: 'group' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('ownerType debe ser enti');
  });

  it('Rechaza ownerId ausente/vacío', () => {
    const result = associateAttachmentToEntiKnowledgeFlow({ attachment: baseAttachment, ownerId: '', ownerType: 'enti' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('ownerId ausente o vacío');
  });

  it('Rechaza attachmentId ausente', () => {
    const invalidAtt = { ...baseAttachment };
    delete (invalidAtt as any).attachmentId;
    const result = associateAttachmentToEntiKnowledgeFlow({ attachment: invalidAtt, ownerId: 'enti-1', ownerType: 'enti' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('Falta attachmentId');
  });

  it('Rechaza campos prohibidos', () => {
    const forbiddenAtt = { ...baseAttachment, blob: {} }; // simulating blob presence
    const result = associateAttachmentToEntiKnowledgeFlow({ attachment: forbiddenAtt, ownerId: 'enti-1', ownerType: 'enti' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('prohibidos');
  });

  it('Rechaza si no se pasa adjunto', () => {
    const result = associateAttachmentToEntiKnowledgeFlow({ attachment: null as any, ownerId: 'enti-1', ownerType: 'enti' });
    expect(result.status).toBe('controlled_error');
  });
});
