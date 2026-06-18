import { describe, it, expect } from 'vitest';
import { entiPromptContextualSourcesPolicy, type EntiPromptContextualSourceValidationRequest } from '../entiPromptContextualSourcesPolicy';

describe('entiPromptContextualSourcesPolicy', () => {
  it('validates a correct request', () => {
    const result = entiPromptContextualSourcesPolicy({
      ownerType: 'enti',
      ownerId: 'e1',
      attachmentId: 'a1',
      scope: 'enti_chat',
      chatId: 'c1',
      contentText: 'text'
    });
    expect(result.status).toBe('valid');
  });

  it('rejects missing ownerType', () => {
    const result = entiPromptContextualSourcesPolicy({
      ownerType: 'group',
      ownerId: 'e1',
      attachmentId: 'a1',
      scope: 'enti_chat',
      chatId: 'c1',
      contentText: 'text'
    });
    expect(result.status).toBe('blocked');
    expect((result as { reason: string }).reason).toContain('ownerType must be enti');
  });

  it('rejects missing ownerId', () => {
    const result = entiPromptContextualSourcesPolicy({
      ownerType: 'enti',
      attachmentId: 'a1',
      scope: 'enti_chat',
      chatId: 'c1',
      contentText: 'text'
    } as unknown as EntiPromptContextualSourceValidationRequest);
    expect(result.status).toBe('blocked');
    expect((result as { reason: string }).reason).toContain('ownerId is required');
  });

  it('rejects missing attachmentId', () => {
    const result = entiPromptContextualSourcesPolicy({
      ownerType: 'enti',
      ownerId: 'e1',
      scope: 'enti_chat',
      chatId: 'c1',
      contentText: 'text'
    } as unknown as EntiPromptContextualSourceValidationRequest);
    expect(result.status).toBe('blocked');
    expect((result as { reason: string }).reason).toContain('attachmentId is required');
  });

  it('rejects invalid scope', () => {
    const result = entiPromptContextualSourcesPolicy({
      ownerType: 'enti',
      ownerId: 'e1',
      attachmentId: 'a1',
      scope: 'invalid_scope' as unknown as import('../../attachments/contextualSourceTypes').ContextualSourceScope,
      chatId: 'c1',
      contentText: 'text'
    } as unknown as EntiPromptContextualSourceValidationRequest);
    expect(result.status).toBe('blocked');
  });

  it('rejects enti_chat without chatId', () => {
    const result = entiPromptContextualSourcesPolicy({
      ownerType: 'enti',
      ownerId: 'e1',
      attachmentId: 'a1',
      scope: 'enti_chat',
      contentText: 'text'
    } as unknown as EntiPromptContextualSourceValidationRequest);
    expect(result.status).toBe('blocked');
  });

  it('rejects missing contentText', () => {
    const result = entiPromptContextualSourcesPolicy({
      ownerType: 'enti',
      ownerId: 'e1',
      attachmentId: 'a1',
      scope: 'enti_chat',
      chatId: 'c1'
    } as unknown as EntiPromptContextualSourceValidationRequest);
    expect(result.status).toBe('blocked');
  });

  it('rejects chatId for knowledge scope', () => {
    const result = entiPromptContextualSourcesPolicy({
      ownerType: 'enti',
      ownerId: 'e1',
      attachmentId: 'a1',
      scope: 'enti_knowledge',
      chatId: 'c1',
      contentText: 'text'
    });
    expect(result.status).toBe('blocked');
  });
});
