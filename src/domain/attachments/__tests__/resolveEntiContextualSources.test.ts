import { resolveEntiContextualSources } from '../resolveEntiContextualSources';
import { type Attachment } from '../attachmentModel';

describe('resolveEntiContextualSources', () => {
  it('returns empty list when no attachments present', () => {
    const result = resolveEntiContextualSources({ ownerId: 'enti-1', attachments: [] });
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.sources).toHaveLength(0);
    }
  });

  it('blocks when ownerId is missing', () => {
    const result = resolveEntiContextualSources({ ownerId: '', attachments: [] });
    expect(result.status).toBe('blocked');
  });

  it('resolves chat, knowledge and work material sources for the correct enti', () => {
    const attachments: Attachment[] = [
      { id: 'att-1', attachmentId: 'att-1', fileName: 'test1.txt', sizeBytes: 100, createdAt: 1, explicitUserAction: true, chatId: 'chat-1', ownerId: 'enti-1', ownerType: 'enti' } as unknown as Attachment,
      { id: 'att-2', attachmentId: 'att-2', fileName: 'test2.txt', sizeBytes: 100, createdAt: 2, explicitUserAction: true, chatId: 'enti_knowledge', ownerId: 'enti-1', ownerType: 'enti' } as unknown as Attachment,
      { id: 'att-3', attachmentId: 'att-3', fileName: 'test3.txt', sizeBytes: 100, createdAt: 3, explicitUserAction: true, chatId: 'enti_work_material', ownerId: 'enti-1', ownerType: 'enti' } as unknown as Attachment,
      { id: 'att-4', attachmentId: 'att-4', fileName: 'test4.txt', sizeBytes: 100, createdAt: 4, explicitUserAction: true, chatId: 'chat-2', ownerId: 'group-1', ownerType: 'group' } as unknown as Attachment,
      { id: 'att-5', attachmentId: 'att-5', fileName: 'test5.txt', sizeBytes: 100, createdAt: 5, explicitUserAction: true, chatId: 'chat-3', ownerId: 'enti-2', ownerType: 'enti' } as unknown as Attachment
    ];

    const result = resolveEntiContextualSources({ ownerId: 'enti-1', attachments });
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const sources = result.sources!;
      expect(sources).toHaveLength(3);
      
      const scopes = sources.map(s => s.scope);
      expect(scopes).toContain('chat_context');
      expect(scopes).toContain('enti_knowledge');
      expect(scopes).toContain('enti_work_material');

      const attIds = sources.map(s => s.attachmentId);
      expect(attIds).toContain('att-1');
      expect(attIds).toContain('att-2');
      expect(attIds).toContain('att-3');
      expect(attIds).not.toContain('att-4');
      expect(attIds).not.toContain('att-5');
    }
  });
});
