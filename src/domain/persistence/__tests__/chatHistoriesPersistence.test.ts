import { describe, it, expect } from 'vitest';
import type { Chat } from '../../chat/Chat';
import {
  persistChatHistoriesFlow,
  restoreChatHistoriesFlow,
  type ChatHistoriesPersistencePayload,
  type ChatHistoriesPersistenceRequest,
  type ChatHistoriesRestoreRequest
} from '../chatHistoriesPersistence';

describe('Chat Histories Functional Persistence', () => {
  const validChat: Chat = {
    id: 'chat-1',
    owner: { type: 'enti', id: 'enti-1' },
    history: [
      { id: 'msg-1', role: 'user', content: 'Hello', timestamp: 1000 },
      { id: 'msg-2', role: 'assistant', content: 'Hi there', timestamp: 1001 }
    ]
  };

  const validGroupChat: Chat = {
    id: 'chat-group-1',
    owner: { type: 'grupo', id: 'group-1' },
    history: [
      { id: 'msg-group-1', role: 'user', content: 'Group hello', timestamp: 2000 }
    ]
  };

  it('blocks execution without explicit user action', () => {
    const request: ChatHistoriesPersistenceRequest = { explicitUserAction: false, chats: [validChat] };
    const result = persistChatHistoriesFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toMatch(/Missing explicit user action/);
  });

  it('persists chat histories successfully (Enti)', () => {
    const request: ChatHistoriesPersistenceRequest = { explicitUserAction: true, chats: [validChat] };
    const result = persistChatHistoriesFlow(request);
    
    expect(result.status).toBe('success');
    expect(result.payload?.root).toBe('chats');
    expect(result.payload?.data.length).toBe(1);
    expect(result.payload?.data[0].id).toBe('chat-1');
  });

  it('restores chat histories successfully from valid payload (Enti)', () => {
    const payload: ChatHistoriesPersistencePayload = {
      root: 'chats',
      version: '1.0',
      data: [validChat]
    };

    const request: ChatHistoriesRestoreRequest = { explicitUserAction: true, payload };
    const result = restoreChatHistoriesFlow(request);

    expect(result.status).toBe('success');
    expect(result.chats?.length).toBe(1);
    expect(result.chats?.[0].id).toBe('chat-1');
    expect(result.chats?.[0].history.length).toBe(2);
  });

  it('restores chat histories successfully from valid payload (Grupo)', () => {
    const payload: ChatHistoriesPersistencePayload = {
      root: 'chats',
      version: '1.0',
      data: [validGroupChat]
    };

    const request: ChatHistoriesRestoreRequest = { explicitUserAction: true, payload };
    const result = restoreChatHistoriesFlow(request);

    expect(result.status).toBe('success');
    expect(result.chats?.length).toBe(1);
    expect(result.chats?.[0].id).toBe('chat-group-1');
    expect(result.chats?.[0].owner.type).toBe('grupo');
  });

  it('returns controlled_error on duplicate chatId', () => {
    const request: ChatHistoriesPersistenceRequest = { explicitUserAction: true, chats: [validChat, validChat] };
    const result = persistChatHistoriesFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Duplicate Chat id/);
  });

  it('returns controlled_error on duplicate messageId in same chat', () => {
    const invalidChat = {
      ...validChat,
      history: [
        { id: 'msg-dup', role: 'user', content: 'A', timestamp: 1 },
        { id: 'msg-dup', role: 'assistant', content: 'B', timestamp: 2 }
      ]
    } as unknown;  
    const request: ChatHistoriesPersistenceRequest = { explicitUserAction: true, chats: [invalidChat] };
    const result = persistChatHistoriesFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Duplicate message id/);
  });

  it('returns controlled_error when payload root is invalid', () => {
    const request: ChatHistoriesRestoreRequest = { explicitUserAction: true, payload: { root: 'invalid', data: [] } };
    const result = restoreChatHistoriesFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Invalid root/);
  });

  it('returns controlled_error when message is incomplete', () => {
    const invalidChat = {
      ...validChat,
      history: [
        { id: 'msg-only', role: 'user' } // Missing content and timestamp
      ]
    } as unknown;  
    const request: ChatHistoriesPersistenceRequest = { explicitUserAction: true, chats: [invalidChat] };
    const result = persistChatHistoriesFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Incomplete message structure/);
  });

  it('returns controlled_error when payload contains secret/apiKey or visualState', () => {
    const payload: ChatHistoriesPersistencePayload = {
      root: 'chats',
      version: '1.0',
      data: [{ ...validChat, visualState: 'open' } as unknown]  
    };
    const request: ChatHistoriesRestoreRequest = { explicitUserAction: true, payload };
    const result = restoreChatHistoriesFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Forbidden state or secret/);
  });

  it('returns controlled_error when payload contains nested forbidden keys', () => {
    const payload: ChatHistoriesPersistencePayload = {
      root: 'chats',
      version: '1.0',
      data: [{
        ...validChat,
        history: [
          { id: 'msg-1', role: 'user', content: 'Hello', timestamp: 1000, apiKey: 'leak' }
        ]
      } as unknown]  
    };
    const request: ChatHistoriesRestoreRequest = { explicitUserAction: true, payload };
    const result = restoreChatHistoriesFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Forbidden state or secret/);
  });
});
