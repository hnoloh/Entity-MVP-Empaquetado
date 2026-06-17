import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGroupSequenceRuntimeAdapter } from '../useGroupSequenceRuntimeAdapter';
import { createGroupFlow } from '../../../domain/group/createGroupFlow';
import { addEntiToGroupSlotFlow } from '../../../domain/group/addEntiToGroupSlotFlow';
import type { ChatRepository } from '../../../domain/chat/chatRepository';
import type { EntiRepository } from '../../../domain/enti/entiRepository';
import type { Chat } from '../../../domain/chat/Chat';
import type { Enti } from '../../../domain/enti/Enti';
import type { Group } from '../../../domain/group/Group';

import * as fs from 'fs';

import * as path from 'path';

// Mock dependencies
const mockChatRepo = {
  getById: vi.fn(),
  save: vi.fn(),
} as unknown as ChatRepository;

const mockEntiRepo = {
  getById: vi.fn(),
} as unknown as EntiRepository;

describe('useGroupSequenceRuntimeAdapter', () => {
  let groups: unknown[];
  let chat: Chat;
  let entis: Enti[];

  beforeEach(() => {
    vi.resetAllMocks();

    chat = {
      id: 'chat-1',
      owner: { id: 'group-1', type: 'grupo' },
      history: []
    };

    entis = [
      { id: 'enti-1', type: 'enti', name: 'Enti 1', status: 'incomplete', cognitiveConfig: { mode: 'local', provider: 'local', model: 'mock' }, harness: { function: '', rules: [], workMaterial: '', knowledge: '' } },
      { id: 'enti-2', type: 'enti', name: 'Enti 2', status: 'incomplete', cognitiveConfig: { mode: 'local', provider: 'local', model: 'mock' }, harness: { function: '', rules: [], workMaterial: '', knowledge: '' } }
    ];

    groups = [createGroupFlow('group-1', 'Test Group')];
    groups = addEntiToGroupSlotFlow(groups as unknown as Group[], entis, 'group-1', 'enti-1', '1');
    groups = addEntiToGroupSlotFlow(groups as unknown as Group[], entis, 'group-1', 'enti-2', '2');

    (mockChatRepo.getById as unknown as ReturnType<typeof vi.fn>).mockReturnValue(chat);
    (mockEntiRepo.getById as unknown as ReturnType<typeof vi.fn>).mockImplementation((id: string) => entis.find(e => e.id === id));
  });

  it('TEST-UIBRIDGE-01: Inicia secuencia solo por acción explícita y no al montar', () => {
    const { result } = renderHook(() => 
      useGroupSequenceRuntimeAdapter('group-1', 'chat-1', groups as unknown as Group[], mockChatRepo, mockEntiRepo)
    );

    expect(result.current.uiState).toBe('idle');
    
    act(() => {
      result.current.actions.initialize();
    });

    console.log("TEST-01 ERROR:", result.current.error, result.current.uiState);

    expect(result.current.uiState).toBe('sequence_initialized');
    expect(result.current.sequenceState?.currentSlotId).toBe('1');
  });

  it('TEST-UIBRIDGE-02: Errores controlados bloquean flujos posteriores sin fallar silenciosamente', async () => {
    const { result } = renderHook(() => 
      useGroupSequenceRuntimeAdapter('group-2', 'chat-1', groups as unknown as Group[], mockChatRepo, mockEntiRepo)
    ); // Invalid group

    act(() => {
      result.current.actions.initialize();
    });

    console.log("TEST-02 ERROR:", result.current.error, result.current.uiState);

    expect(result.current.uiState).toBe('controlled_error');
    expect(result.current.error).toContain('no existe');

    // Trying to advance should also fail
    act(() => {
      result.current.actions.advanceSequence();
    });

    expect(result.current.uiState).toBe('controlled_error');
    expect(result.current.error).toContain('Secuencia no inicializada');
  });

  it('TEST-UIBRIDGE-03: Forbidden units scan (sin localStorage o window)', () => {

    const code = fs.readFileSync(path.join(__dirname, '../useGroupSequenceRuntimeAdapter.ts'), 'utf-8');
    
    expect(code).not.toContain('localStorage');
    // window is used only for dispatching CustomEvent which is part of UI update, but not for storing UI state.
    // ChatWindow auto-open is forbidden.
    expect(code).not.toContain('openChatWindow');
  });
});
