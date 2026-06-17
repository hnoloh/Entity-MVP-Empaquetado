import type { Chat, ChatMessage } from '../chat/Chat';

export interface ChatHistoriesPersistencePayload {
  root: 'chats';
  version: string;
  data: Chat[];
}

export interface ChatHistoriesPersistenceRequest {
  explicitUserAction: boolean;
  chats: Chat[];
}

export interface ChatHistoriesRestoreRequest {
  explicitUserAction: boolean;
  payload: unknown;
}

export interface ChatHistoriesPersistenceResult {
  status: 'success' | 'blocked' | 'controlled_error';
  payload?: ChatHistoriesPersistencePayload;
  error?: string;
}

export interface ChatHistoriesRestoreResult {
  status: 'success' | 'blocked' | 'controlled_error';
  chats?: Chat[];
  error?: string;
}

const FORBIDDEN_KEYS = [
  'apiKey', 'secret', 'token',
  'runtimeState', 'providerState', 'visualState', 
  'layout', 'window', 'foco', 'focus'
];

function hasForbiddenKeys(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_KEYS.includes(key)) {
      return true;
    }
    // Deep check
    if (typeof record[key] === 'object' && record[key] !== null) {
      if (hasForbiddenKeys(record[key])) {
        return true;
      }
    }
  }
  return false;
}

export function persistChatHistoriesFlow(request: ChatHistoriesPersistenceRequest): ChatHistoriesPersistenceResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Missing explicit user action' };
  }

  if (!Array.isArray(request.chats)) {
    return { status: 'controlled_error', error: 'Input must be an array of Chats' };
  }

  const ids = new Set<string>();
  const safeData: Chat[] = [];

  for (const chat of request.chats) {
    if (!chat.id) {
      return { status: 'controlled_error', error: 'Chat is missing id' };
    }
    if (ids.has(chat.id)) {
      return { status: 'controlled_error', error: `Duplicate Chat id found: ${chat.id}` };
    }
    ids.add(chat.id);

    if (hasForbiddenKeys(chat)) {
      return { status: 'controlled_error', error: `Forbidden state or secret found in chat: ${chat.id}` };
    }

    const messageIds = new Set<string>();
    if (Array.isArray(chat.history)) {
      for (const msg of chat.history) {
        if (!msg.id || typeof msg.content !== 'string' || !msg.role || typeof msg.timestamp !== 'number') {
           return { status: 'controlled_error', error: `Incomplete message structure in chat: ${chat.id}` };
        }
        if (messageIds.has(msg.id)) {
          return { status: 'controlled_error', error: `Duplicate message id ${msg.id} in chat: ${chat.id}` };
        }
        messageIds.add(msg.id);
      }
    }

    // Creating safe copy to avoid any unwanted fields
    const safeChat: Chat = {
      id: chat.id,
      owner: {
        type: chat.owner.type,
        id: chat.owner.id
      },
      history: (chat.history || []).map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    };
    
    safeData.push(safeChat);
  }

  return {
    status: 'success',
    payload: {
      root: 'chats',
      version: '1.0',
      data: safeData
    }
  };
}

export function restoreChatHistoriesFlow(request: ChatHistoriesRestoreRequest): ChatHistoriesRestoreResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Missing explicit user action' };
  }

  const payload = request.payload as Record<string, unknown>;

  if (!payload || typeof payload !== 'object') {
    return { status: 'controlled_error', error: 'Payload must be an object' };
  }

  if (payload.root !== 'chats') {
    return { status: 'controlled_error', error: 'Invalid root in payload' };
  }

  if (!Array.isArray(payload.data)) {
    return { status: 'controlled_error', error: 'Payload data must be an array' };
  }

  const ids = new Set<string>();
  const restored: Chat[] = [];

  for (const item of payload.data) {
    if (!item || typeof item !== 'object') {
      return { status: 'controlled_error', error: 'Chat entry must be an object' };
    }

    const chat = item as Record<string, unknown>;

    if (typeof chat.id !== 'string' || !chat.id.trim()) {
      return { status: 'controlled_error', error: 'Chat entry missing or invalid id' };
    }

    if (ids.has(chat.id)) {
      return { status: 'controlled_error', error: `Duplicate chatId found in payload: ${chat.id}` };
    }
    ids.add(chat.id);

    if (hasForbiddenKeys(chat)) {
      return { status: 'controlled_error', error: `Forbidden state or secret found in chat: ${chat.id}` };
    }

    const owner = chat.owner as Record<string, unknown>;
    if (!owner || typeof owner.type !== 'string' || typeof owner.id !== 'string') {
      return { status: 'controlled_error', error: `Invalid owner in chat: ${chat.id}` };
    }

    const messageIds = new Set<string>();
    const safeHistory: ChatMessage[] = [];

    if (Array.isArray(chat.history)) {
      for (const msg of chat.history) {
        if (!msg.id || typeof msg.content !== 'string' || !msg.role || typeof msg.timestamp !== 'number') {
           return { status: 'controlled_error', error: `Incomplete message structure in chat: ${chat.id}` };
        }
        if (messageIds.has(msg.id)) {
          return { status: 'controlled_error', error: `Duplicate message id ${msg.id} in chat: ${chat.id}` };
        }
        messageIds.add(msg.id);

        safeHistory.push({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        });
      }
    }

    restored.push({
      id: chat.id,
      owner: {
        type: owner.type as Chat['owner']['type'],
        id: owner.id
      },
      history: safeHistory
    });
  }

  return { status: 'success', chats: restored };
}
