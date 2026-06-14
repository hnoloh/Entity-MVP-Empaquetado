import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ChatView } from '../ChatView';
import { chatRepository, createChatFlow } from '../../../domain/chat';
import * as fs from 'fs';
import * as path from 'path';

describe('ChatViewMultichat - RV-03/FIA-015', () => {
  beforeEach(() => {
    chatRepository.clear();
    vi.restoreAllMocks();
  });
  
  afterEach(() => {
    cleanup();
  });

  it('TEST-FIA015-01: coexistencia de dos Chats abiertos sin cierre automático', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    
    render(
      <div>
        <ChatView chatId={chatA.id} />
        <ChatView chatId={chatB.id} />
      </div>
    );
    
    expect(screen.getByTestId(`chat-view-${chatA.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`chat-view-${chatB.id}`)).toBeInTheDocument();
  });

  it('TEST-FIA015-04: draft local aislado por ChatView/Chat objetivo', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    
    render(
      <div>
        <div data-testid="container-a"><ChatView chatId={chatA.id} /></div>
        <div data-testid="container-b"><ChatView chatId={chatB.id} /></div>
      </div>
    );
    
    const containerA = screen.getByTestId('container-a');
    const inputA = containerA.querySelector('[data-testid="chat-composer-input"]') as HTMLInputElement;
    fireEvent.change(inputA, { target: { value: 'Borrador para A' } });
    
    const containerB = screen.getByTestId('container-b');
    const inputB = containerB.querySelector('[data-testid="chat-composer-input"]') as HTMLInputElement;
    expect(inputB.value).toBe('');
    expect(inputA.value).toBe('Borrador para A');
  });

  it('TEST-FIA015-15: forbidden-units scan sin Runtime, Prompt Engine, provider real, SDK/red, backend, storage persistente, autosave, ChatWindow operativo, RV-04, RV-05 ni FIA-016', () => {
    const filesToCheck = [
      '../../../domain/chat/chatRepository.ts',
      '../../../domain/chat/sendMessageToChatFlow.ts',
      '../ChatView.tsx'
    ];
    
    for (const relativePath of filesToCheck) {
      const code = fs.readFileSync(path.join(__dirname, relativePath), 'utf-8');
      expect(code).not.toContain('Runtime');
      expect(code).not.toContain('fetch');
      expect(code).not.toContain('localStorage');
      expect(code).not.toContain('ChatWindow');
      expect(code).not.toContain('EditorGrupo');
      expect(code).not.toContain('RV-04');
    }
  });
});
