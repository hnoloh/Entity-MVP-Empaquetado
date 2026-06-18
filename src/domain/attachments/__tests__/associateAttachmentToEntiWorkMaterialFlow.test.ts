import { describe, it, expect } from 'vitest';
import { associateAttachmentToEntiWorkMaterialFlow } from '../associateAttachmentToEntiWorkMaterialFlow';
import type { Attachment } from '../attachmentModel';

describe('associateAttachmentToEntiWorkMaterialFlow', () => {
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

  it('Asocia adjunto válido a Material de Trabajo de Enti con resultado success', () => {
    const result = associateAttachmentToEntiWorkMaterialFlow({ attachment: baseAttachment, ownerId: 'enti-1', ownerType: 'enti' });
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.attachmentId).toBe('att-1');
      expect(result.ownerType).toBe('enti');
      expect(result.ownerId).toBe('enti-1');
      expect(result.workMaterialScope).toBe('enti_work_material');
    }
  });

  it('Rechaza ownerType group', () => {
    const result = associateAttachmentToEntiWorkMaterialFlow({ attachment: { ...baseAttachment, ownerType: 'group' }, ownerId: 'enti-1', ownerType: 'group' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('ownerType debe ser enti');
  });

  it('Rechaza ownerId ausente/vacío', () => {
    const result = associateAttachmentToEntiWorkMaterialFlow({ attachment: baseAttachment, ownerId: '', ownerType: 'enti' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('ownerId ausente o vacío');
  });

  it('Rechaza attachmentId ausente', () => {
    const invalidAtt = { ...baseAttachment };
    delete (invalidAtt as unknown).attachmentId;
    const result = associateAttachmentToEntiWorkMaterialFlow({ attachment: invalidAtt, ownerId: 'enti-1', ownerType: 'enti' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('Falta attachmentId');
  });

  it('Rechaza campos prohibidos (rawText)', () => {
    const forbiddenAtt = { ...baseAttachment, rawText: 'Hello' }; 
    const result = associateAttachmentToEntiWorkMaterialFlow({ attachment: forbiddenAtt, ownerId: 'enti-1', ownerType: 'enti' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') expect(result.reason).toContain('prohibidos');
  });

  it('Rechaza campos prohibidos (embedding)', () => {
    const forbiddenAtt = { ...baseAttachment, embedding: [0.1, 0.2] }; 
    const result = associateAttachmentToEntiWorkMaterialFlow({ attachment: forbiddenAtt, ownerId: 'enti-1', ownerType: 'enti' });
    expect(result.status).toBe('blocked');
  });

  it('Rechaza si no se pasa adjunto', () => {
    const result = associateAttachmentToEntiWorkMaterialFlow({ attachment: null, ownerId: 'enti-1', ownerType: 'enti' });
    expect(result.status).toBe('controlled_error');
  });
});
