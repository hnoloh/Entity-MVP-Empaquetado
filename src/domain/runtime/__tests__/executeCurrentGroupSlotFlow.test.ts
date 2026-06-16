import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCurrentGroupSlotFlow } from '../executeCurrentGroupSlotFlow';
import { Group } from '../../group/Group';
import { Enti } from '../../enti/Enti';
import { Chat } from '../../chat/Chat';
import { GroupSequenceInitializationResult } from '../RuntimeExecutionResult';
import { GroupSlotExecutionRequest } from '../RuntimeExecutionRequest';
import type { ProviderBridge } from '../provider/ProviderBridge';
import * as chatModule from '../../chat/receiveResponseToChatFlow';
import fs from 'fs';
import path from 'path';

describe('executeCurrentGroupSlotFlow', () => {
  let mockGroups: Group[];
  let mockEntis: Enti[];
  let mockGroupChat: Chat;
  let mockProvider: ProviderBridge;
  let mockSequenceState: GroupSequenceInitializationResult;

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
      }
    ];

    mockEntis = [
      {
        id: 'enti-1',
        type: 'enti',
        name: 'Enti 1',
        cognitiveConfig: { provider: 'local', model: 'llama' },
        harness: { function: 'Mock function', rules: [] },
        createdAt: 0,
        updatedAt: 0
      },
      {
        id: 'enti-2',
        type: 'enti',
        name: 'Enti 2',
        harness: { function: 'Mock function 2', rules: [] },
        createdAt: 0,
        updatedAt: 0
      }
    ];

    mockGroupChat = {
      id: 'chat-1',
      owner: { type: 'group', id: 'group-1' },
      history: [],
      createdAt: 0,
      updatedAt: 0
    };

    mockProvider = {
      execute: vi.fn().mockResolvedValue({ success: true, responseText: 'Hello from mock provider' })
    };

    mockSequenceState = {
      status: 'initialized',
      groupId: 'group-1',
      chatId: 'chat-1',
      sequenceId: 'seq-1',
      currentSlotId: '1',
      pendingSlotIds: ['1', '2'],
      completedSlotIds: []
    };

    vi.spyOn(chatModule, 'receiveResponseToChatFlow').mockImplementation(() => {});
  });

  it('TEST-FIA007-01: executeCurrentGroupSlotFlow ejecuta el Enti de currentSlotId cuando la secuencia está inicializada', async () => {
    const request: GroupSlotExecutionRequest = {
      sequenceState: mockSequenceState,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: '1',
      explicitUserAction: true
    };

    const result = await executeCurrentGroupSlotFlow(
      request,
      mockGroups,
      mockEntis,
      mockGroupChat,
      mockProvider
    );

    expect(result.status).toBe('executed');
    expect(result.groupId).toBe('group-1');
    expect(result.slotId).toBe('1');
    expect(result.entiId).toBe('enti-1');
    expect(result.responseText).toBe('Hello from mock provider');
    expect(mockProvider.execute).toHaveBeenCalledTimes(1);
    expect(chatModule.receiveResponseToChatFlow).toHaveBeenCalledWith('chat-1', 'Hello from mock provider');
  });

  it('TEST-FIA007-02: Bloquea ejecución sin acción explícita', async () => {
    const request: GroupSlotExecutionRequest = {
      sequenceState: mockSequenceState,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: '1',
      explicitUserAction: false
    };

    const result = await executeCurrentGroupSlotFlow(
      request,
      mockGroups,
      mockEntis,
      mockGroupChat,
      mockProvider
    );

    expect(result.status).toBe('blocked');
    expect(result.error).toContain('acción explícita');
  });

  it('TEST-FIA007-03: Error controlado si currentSlotId falta o no coincide con el estado', async () => {
    const request: GroupSlotExecutionRequest = {
      sequenceState: mockSequenceState,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: '2', // does not match sequence state
      explicitUserAction: true
    };

    const result = await executeCurrentGroupSlotFlow(
      request,
      mockGroups,
      mockEntis,
      mockGroupChat,
      mockProvider
    );

    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('no coincide');
  });

  it('TEST-FIA007-04: Error controlado si falta Enti asignado al slot', async () => {
    mockSequenceState.currentSlotId = '3';
    const request: GroupSlotExecutionRequest = {
      sequenceState: mockSequenceState,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: '3',
      explicitUserAction: true
    };

    const result = await executeCurrentGroupSlotFlow(
      request,
      mockGroups,
      mockEntis,
      mockGroupChat,
      mockProvider
    );

    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('no contiene un Enti');
  });

  it('TEST-FIA007-05: Error controlado si falta Chat de Grupo', async () => {
    const request: GroupSlotExecutionRequest = {
      sequenceState: mockSequenceState,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: '1',
      explicitUserAction: true
    };

    const result = await executeCurrentGroupSlotFlow(
      request,
      mockGroups,
      mockEntis,
      undefined,
      mockProvider
    );

    expect(result.status).toBe('controlled_error');
    expect(result.error).toContain('No se encontró el Chat');
  });

  it('TEST-FIA007-06: No muta estado, no avanza currentSlotId ni ejecuta otros slots', async () => {
    const request: GroupSlotExecutionRequest = {
      sequenceState: mockSequenceState,
      groupId: 'group-1',
      chatId: 'chat-1',
      currentSlotId: '1',
      explicitUserAction: true
    };

    await executeCurrentGroupSlotFlow(
      request,
      mockGroups,
      mockEntis,
      mockGroupChat,
      mockProvider
    );

    // Sequence state should not be mutated
    expect(mockSequenceState.currentSlotId).toBe('1');
    expect(mockSequenceState.completedSlotIds).toEqual([]);
    expect(mockProvider.execute).toHaveBeenCalledTimes(1);
    // Since mockProvider returns once, it only executes slot 1, nothing else.
  });

  it('TEST-FIA007-07: Forbidden units compliance', () => {
    const code = fs.readFileSync(path.join(__dirname, '../executeCurrentGroupSlotFlow.ts'), 'utf-8');
    expect(code).not.toContain('window.');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('fetch(');
    expect(code).not.toContain('axios');
    expect(code).not.toContain('new OpenAI');
    expect(code).not.toContain('ChatWindow');
  });
});
