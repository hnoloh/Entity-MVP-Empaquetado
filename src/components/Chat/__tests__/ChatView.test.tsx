import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatView } from '../ChatView';
import { chatRepository, createChatFlow, sendMessageToChatFlow, receiveResponseToChatFlow } from '../../../domain/chat';
import * as fs from 'fs';
import * as path from 'path';

describe('ChatView - RV-03/FIA-010', () => {
  beforeEach(() => {
    chatRepository.clear();
    vi.restoreAllMocks();
  });

  it('TEST-FIA010-01: renderiza Vista Chat para Chat owner Enti con historial vacío', () => {
    const chat = createChatFlow('enti', 'E1');
    render(<ChatView chatId={chat.id} />);
    
    expect(screen.getByTestId(`chat-view-${chat.id}`)).toBeInTheDocument();
    expect(screen.getByTestId('chat-view-empty')).toBeInTheDocument();
  });

  it('TEST-FIA010-02: renderiza historial user/assistant preservando orden, roles y contenido', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'Hola user');
    receiveResponseToChatFlow(chat.id, 'Hola assistant');

    render(<ChatView chatId={chat.id} />);

    const messages = screen.getAllByTestId('chat-message');
    expect(messages).toHaveLength(2);
    expect(messages[0]).toHaveTextContent('user');
    expect(messages[0]).toHaveTextContent('Hola user');
    expect(messages[1]).toHaveTextContent('assistant');
    expect(messages[1]).toHaveTextContent('Hola assistant');
  });

  it('TEST-FIA010-03: renderiza Chat owner Grupo sin introducir Grupo operativo', () => {
    const chat = createChatFlow('grupo', 'G1');
    render(<ChatView chatId={chat.id} />);
    
    expect(screen.getByTestId(`chat-view-${chat.id}`)).toBeInTheDocument();
  });

  it('TEST-FIA010-04: chatId inexistente no crea Chat ni muta ChatRepository', () => {
    const snapshotBefore = JSON.stringify(chatRepository.list());
    render(<ChatView chatId="missing-id" />);
    
    expect(screen.getByTestId('chat-view-error')).toBeInTheDocument();
    const snapshotAfter = JSON.stringify(chatRepository.list());
    expect(snapshotBefore).toBe(snapshotAfter);
  });

  it('TEST-FIA010-05: render de vista no invoca save, delete ni clear de ChatRepository', () => {
    const chat = createChatFlow('enti', 'E1');
    const saveSpy = vi.spyOn(chatRepository, 'save');
    const deleteSpy = vi.spyOn(chatRepository, 'delete');
    const clearSpy = vi.spyOn(chatRepository, 'clear');

    render(<ChatView chatId={chat.id} />);

    expect(saveSpy).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
  });

  it('TEST-FIA010-06: aislamiento multi-chat; no mezcla historial de otro Chat', () => {
    const chat1 = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat1.id, 'Mensaje 1');
    
    const chat2 = createChatFlow('grupo', 'G1');
    sendMessageToChatFlow(chat2.id, 'Mensaje 2');

    render(<ChatView chatId={chat1.id} />);

    expect(screen.getByText('Mensaje 1')).toBeInTheDocument();
    expect(screen.queryByText('Mensaje 2')).not.toBeInTheDocument();
  });

  it('TEST-FIA010-10: forbidden-units scan sin Runtime, Prompt Engine, SDK/red, backend, storage, autosave, RV-04 ni FIA-011', () => {
    const code = fs.readFileSync(path.join(__dirname, '../ChatView.tsx'), 'utf-8');

    expect(code).not.toContain('PromptEngine');
    expect(code).not.toContain('fetch(');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('sessionStorage');
    expect(code).not.toContain('Composer');
  });
});
