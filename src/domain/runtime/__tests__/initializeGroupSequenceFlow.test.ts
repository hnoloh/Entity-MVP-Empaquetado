import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeGroupSequenceFlow } from '../initializeGroupSequenceFlow';
import type { Group } from '../../group/Group';
import type { ChatRepository } from '../../chat/chatRepository';
import type { Chat } from '../../chat/Chat';
import type { GroupSequenceInitializationRequest } from '../RuntimeExecutionRequest';
import fs from 'fs';
import path from 'path';

describe('initializeGroupSequenceFlow', () => {
  let mockGroups: Group[];
  let mockChatRepo: ChatRepository;

  beforeEach(() => {
    mockGroups = [
      {
        id: 'group-1',
        type: 'group',
        name: 'Group 1',
        slots: {
          '1': 'enti-1',
          '2': 'enti-2'
        }
      },
      {
        id: 'group-2',
        type: 'group',
        name: 'Group 2',
        slots: {
          '1': 'enti-1',
          '3': 'enti-2' // Gap detected
        }
      },
      {
        id: 'group-3',
        type: 'group',
        name: 'Group 3',
        slots: {
          '1': 'enti-1' // Invalid cardinality
        }
      },
      {
        id: 'group-4',
        type: 'group',
        name: 'Group 4',
        slots: {
          '1': 'enti-1',
          '2': 'enti-2',
          '3': 'enti-3',
          '4': 'enti-4',
          '5': 'enti-5'
        }
      }
    ];

    const chats: Record<string, Chat> = {
      'chat-1': {
        id: 'chat-1',
        owner: { type: 'grupo', id: 'group-1' },
        history: []
      },
      'chat-4': {
        id: 'chat-4',
        owner: { type: 'grupo', id: 'group-4' },
        history: []
      },
      'chat-invalid': {
        id: 'chat-invalid',
        owner: { type: 'enti', id: 'enti-1' },
        history: []
      }
    };

    mockChatRepo = {
      save: vi.fn(),
      getById: vi.fn((id: string) => chats[id]),
      delete: vi.fn(),
      getAll: vi.fn()
    } as unknown as ChatRepository;
  });

  it('TEST-FIA006-01: Inicialización correcta con Grupo válido de 2 integrantes', () => {
    const request: GroupSequenceInitializationRequest = {
      groupId: 'group-1',
      groupChatId: 'chat-1',
      requestedByUserAction: true,
      targetType: 'GROUP'
    };

    const result = initializeGroupSequenceFlow(request, mockGroups, mockChatRepo);

    expect(result.status).toBe('initialized');
    expect(result.groupId).toBe('group-1');
    expect(result.chatId).toBe('chat-1');
    expect(result.sequenceId).toBeDefined();
    expect(result.currentSlotId).toBe('1');
    expect(result.pendingSlotIds).toEqual(['1', '2']);
    expect(result.completedSlotIds).toEqual([]);
  });

  it('TEST-FIA006-02: Inicialización correcta con Grupo válido de 5 integrantes', () => {
    const request: GroupSequenceInitializationRequest = {
      groupId: 'group-4',
      groupChatId: 'chat-4',
      requestedByUserAction: true,
      targetType: 'GROUP'
    };

    const result = initializeGroupSequenceFlow(request, mockGroups, mockChatRepo);

    expect(result.status).toBe('initialized');
    expect(result.groupId).toBe('group-4');
    expect(result.chatId).toBe('chat-4');
    expect(result.currentSlotId).toBe('1');
    expect(result.pendingSlotIds).toEqual(['1', '2', '3', '4', '5']);
    expect(result.completedSlotIds).toEqual([]);
  });

  it('TEST-FIA006-03: Bloqueo sin acción explícita', () => {
    const request: GroupSequenceInitializationRequest = {
      groupId: 'group-1',
      groupChatId: 'chat-1',
      requestedByUserAction: false,
      targetType: 'GROUP'
    };

    const result = initializeGroupSequenceFlow(request, mockGroups, mockChatRepo);

    expect(result.status).toBe('blocked');
    expect(result.error).toContain('acción explícita');
  });

  it('TEST-FIA006-04: Error controlado sin Grupo objetivo', () => {
    const request: GroupSequenceInitializationRequest = {
      groupId: 'non-existent',
      groupChatId: 'chat-1',
      requestedByUserAction: true,
      targetType: 'GROUP'
    };

    const result = initializeGroupSequenceFlow(request, mockGroups, mockChatRepo);

    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('no existe');
  });

  it('TEST-FIA006-05: Error controlado sin Chat de Grupo objetivo', () => {
    const request: GroupSequenceInitializationRequest = {
      groupId: 'group-1',
      groupChatId: 'non-existent',
      requestedByUserAction: true,
      targetType: 'GROUP'
    };

    const result = initializeGroupSequenceFlow(request, mockGroups, mockChatRepo);

    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('ausente o inconsistente');
  });

  it('TEST-FIA006-06: Error controlado con Chat de otro tipo', () => {
    const request: GroupSequenceInitializationRequest = {
      groupId: 'group-1',
      groupChatId: 'chat-invalid', // belongs to enti
      requestedByUserAction: true,
      targetType: 'GROUP'
    };

    const result = initializeGroupSequenceFlow(request, mockGroups, mockChatRepo);

    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('inconsistente');
  });

  it('TEST-FIA006-07: Bloqueo por cardinalidad inválida', () => {
    mockGroups[2] = { ...mockGroups[2], id: 'group-3' }; // Force existence
    const request: GroupSequenceInitializationRequest = {
      groupId: 'group-3',
      groupChatId: 'chat-1', // Mock chat repo will return chat-1 but we bypass it for test logic if chat is found. Wait, chat-1 is owned by group-1. Let's make chat-3.
      requestedByUserAction: true,
      targetType: 'GROUP'
    };
    
    // We mock chat-3 directly in getById
    const localMockChatRepo = {
      ...mockChatRepo,
      getById: vi.fn(() => ({ id: 'chat-3', owner: { type: 'grupo', id: 'group-3' }, history: [] }))
    } as unknown as ChatRepository;

    const result = initializeGroupSequenceFlow(request, mockGroups, localMockChatRepo);

    expect(result.status).toBe('blocked');
    expect(result.error).toContain('Cardinalidad');
  });

  it('TEST-FIA006-08: Bloqueo por huecos inválidos', () => {
    const request: GroupSequenceInitializationRequest = {
      groupId: 'group-2',
      groupChatId: 'chat-2',
      requestedByUserAction: true,
      targetType: 'GROUP'
    };

    const localMockChatRepo = {
      ...mockChatRepo,
      getById: vi.fn(() => ({ id: 'chat-2', owner: { type: 'grupo', id: 'group-2' }, history: [] }))
    } as unknown as ChatRepository;

    const result = initializeGroupSequenceFlow(request, mockGroups, localMockChatRepo);

    expect(result.status).toBe('blocked');
    expect(result.error).toContain('Hueco');
  });

  it('TEST-FIA006-09: No muta ni afecta a otros módulos (forbidden units)', () => {
    // Escaneo pasivo verificando que no se inyectan importaciones prohibidas
    const code = fs.readFileSync(path.join(__dirname, '../initializeGroupSequenceFlow.ts'), 'utf-8');
    
    expect(code).not.toContain('window.');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('fetch(');
    expect(code).not.toContain('axios');
    expect(code).not.toContain('Provider');
    expect(code).not.toContain('executeEnti');
    expect(code).not.toContain('ChatWindow');
  });
});
