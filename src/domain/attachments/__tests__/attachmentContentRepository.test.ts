import { describe, it, expect, beforeEach } from 'vitest';
import { attachmentContentRepository } from '../attachmentContentRepository';
import type { AttachmentContentRepositoryEntry, AttachmentContentRepositoryKey } from '../attachmentContentRepositoryTypes';

describe('attachmentContentRepository', () => {
  beforeEach(() => {
    attachmentContentRepository.clear();
  });

  const entryEntiChat: AttachmentContentRepositoryEntry = {
    attachmentId: 'att-1',
    ownerType: 'enti',
    ownerId: 'enti-1',
    chatId: 'chat-1',
    scope: 'enti_chat',
    contentText: 'Hello chat',
    readAt: new Date().toISOString()
  };

  const entryEntiKnowledge: AttachmentContentRepositoryEntry = {
    attachmentId: 'att-2',
    ownerType: 'enti',
    ownerId: 'enti-1',
    scope: 'enti_knowledge',
    contentText: 'Hello knowledge',
    readAt: new Date().toISOString()
  };

  const entryGroupChat: AttachmentContentRepositoryEntry = {
    attachmentId: 'att-3',
    ownerType: 'group',
    ownerId: 'group-1',
    chatId: 'chat-group-1',
    scope: 'group_chat',
    contentText: 'Hello group',
    readAt: new Date().toISOString()
  };

  it('upserts and gets an entry successfully', () => {
    const upsertRes = attachmentContentRepository.upsert(entryEntiChat);
    expect(upsertRes.status).toBe('success');

    const key: AttachmentContentRepositoryKey = {
      attachmentId: entryEntiChat.attachmentId,
      ownerType: entryEntiChat.ownerType,
      ownerId: entryEntiChat.ownerId,
      chatId: entryEntiChat.chatId,
      scope: entryEntiChat.scope
    };

    const getRes = attachmentContentRepository.get(key);
    expect(getRes.status).toBe('success');
    if (getRes.status === 'success' && 'entry' in getRes) {
      expect(getRes.entry).toEqual(entryEntiChat);
    } else {
      expect.fail('Expected entry to be found');
    }
  });

  it('lists by scope correctly', () => {
    attachmentContentRepository.upsert(entryEntiChat);
    attachmentContentRepository.upsert(entryEntiKnowledge);

    const res = attachmentContentRepository.listByScope('enti', 'enti-1', 'enti_chat', 'chat-1');
    expect(res.status).toBe('success');
    if (res.status === 'success' && 'entries' in res) {
      expect(res.entries.length).toBe(1);
      expect(res.entries[0].attachmentId).toBe('att-1');
    }
  });

  it('lists by owner correctly', () => {
    attachmentContentRepository.upsert(entryEntiChat);
    attachmentContentRepository.upsert(entryEntiKnowledge);
    attachmentContentRepository.upsert(entryGroupChat);

    const res = attachmentContentRepository.listByOwner('enti', 'enti-1');
    expect(res.status).toBe('success');
    if (res.status === 'success' && 'entries' in res) {
      expect(res.entries.length).toBe(2);
    }
  });

  it('removes an entry correctly', () => {
    attachmentContentRepository.upsert(entryGroupChat);
    const key: AttachmentContentRepositoryKey = {
      attachmentId: entryGroupChat.attachmentId,
      ownerType: entryGroupChat.ownerType,
      ownerId: entryGroupChat.ownerId,
      chatId: entryGroupChat.chatId,
      scope: entryGroupChat.scope
    };

    const removeRes = attachmentContentRepository.remove(key);
    expect(removeRes.status).toBe('success');
    if (removeRes.status === 'success' && 'entryFound' in removeRes) {
      expect(removeRes.entryFound).toBe(true);
    }

    const getRes = attachmentContentRepository.get(key);
    expect(getRes.status).toBe('success');
    if (getRes.status === 'success' && 'entryFound' in getRes) {
      expect(getRes.entryFound).toBe(false);
    }
  });

  it('creates a safe snapshot', () => {
    attachmentContentRepository.upsert(entryEntiChat);
    const snapshot = attachmentContentRepository.snapshot();
    expect(snapshot.entries.length).toBe(1);
    expect(snapshot.entries[0]).toEqual(entryEntiChat);

    // ensure it is a copy
    snapshot.entries[0].contentText = 'modified';
    const key: AttachmentContentRepositoryKey = {
      attachmentId: entryEntiChat.attachmentId,
      ownerType: entryEntiChat.ownerType,
      ownerId: entryEntiChat.ownerId,
      chatId: entryEntiChat.chatId,
      scope: entryEntiChat.scope
    };
    const getRes = attachmentContentRepository.get(key);
    if (getRes.status === 'success' && 'entry' in getRes) {
      expect(getRes.entry.contentText).toBe('Hello chat');
    }
  });
});
