import { describe, it, expect, beforeEach } from 'vitest';
import { buildEntiPromptContextualSourceBlock } from '../buildEntiPromptContextualSourceBlock';
import { attachmentContentRepository } from '../../../attachments/attachmentContentRepository';
import type { ContextualSourceDescriptor } from '../../../attachments/contextualSourceTypes';

describe('buildEntiPromptContextualSourceBlock', () => {
  beforeEach(() => {
    attachmentContentRepository.clear();
  });

  it('builds blocks correctly for different scopes', () => {
    attachmentContentRepository.upsert({
      attachmentId: 'att1',
      ownerType: 'enti',
      ownerId: 'e1',
      chatId: 'c1',
      scope: 'enti_chat',
      contentText: 'chat text',
      readAt: '123'
    });

    attachmentContentRepository.upsert({
      attachmentId: 'att2',
      ownerType: 'enti',
      ownerId: 'e1',
      scope: 'enti_knowledge',
      contentText: 'knowledge text',
      readAt: '123'
    });

    const descriptors: ContextualSourceDescriptor[] = [
      { attachmentId: 'att1', ownerType: 'enti', ownerId: 'e1', scope: 'chat_context' },
      { attachmentId: 'att2', ownerType: 'enti', ownerId: 'e1', scope: 'enti_knowledge' }
    ];

    const result = buildEntiPromptContextualSourceBlock('e1', 'c1', descriptors);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.block.chatSources.length).toBe(1);
      expect(result.block.chatSources[0].attachmentId).toBe('att1');
      
      expect(result.block.knowledgeSources.length).toBe(1);
      expect(result.block.knowledgeSources[0].attachmentId).toBe('att2');

      expect(result.block.workMaterialSources.length).toBe(0);
      expect(result.errors.length).toBe(0);
    }
  });

  it('handles partial controlled error', () => {
    attachmentContentRepository.upsert({
      attachmentId: 'att1',
      ownerType: 'enti',
      ownerId: 'e1',
      chatId: 'c1',
      scope: 'enti_chat',
      contentText: 'chat text',
      readAt: '123'
    });

    const descriptors: ContextualSourceDescriptor[] = [
      { attachmentId: 'att1', ownerType: 'enti', ownerId: 'e1', scope: 'chat_context' },
      { attachmentId: 'att2', ownerType: 'enti', ownerId: 'e1', scope: 'chat_context' } // missing in repo
    ];

    const result = buildEntiPromptContextualSourceBlock('e1', 'c1', descriptors);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.block.chatSources.length).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].attachmentId).toBe('att2');
    }
  });

  it('does not mutate original list and preserves deterministic order', () => {
    attachmentContentRepository.upsert({
      attachmentId: 'b_att',
      ownerType: 'enti',
      ownerId: 'e1',
      scope: 'enti_knowledge',
      contentText: 'text b',
      readAt: '123'
    });
    attachmentContentRepository.upsert({
      attachmentId: 'a_att',
      ownerType: 'enti',
      ownerId: 'e1',
      scope: 'enti_knowledge',
      contentText: 'text a',
      readAt: '123'
    });

    const descriptors: ContextualSourceDescriptor[] = [
      { attachmentId: 'b_att', ownerType: 'enti', ownerId: 'e1', scope: 'enti_knowledge' },
      { attachmentId: 'a_att', ownerType: 'enti', ownerId: 'e1', scope: 'enti_knowledge' }
    ];

    const result = buildEntiPromptContextualSourceBlock('e1', 'c1', descriptors);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.block.knowledgeSources[0].attachmentId).toBe('a_att');
      expect(result.block.knowledgeSources[1].attachmentId).toBe('b_att');
    }
  });
});
