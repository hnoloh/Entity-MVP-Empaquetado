import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatView } from '../ChatView';
import { chatRepository, createChatFlow } from '../../../domain/chat';
import * as fs from 'fs';
import * as path from 'path';

describe('ChatMessageInput - RV-03/FIA-011', () => {
  beforeEach(() => {
    chatRepository.clear();
    vi.restoreAllMocks();
  });

  it('TEST-FIA011-01: render de entrada/composer en Chat existente abierto', () => {
    const chat = createChatFlow('enti', 'E1');
    render(<ChatView chatId={chat.id} />);
    
    expect(screen.getByTestId('chat-composer-input')).toBeInTheDocument();
    expect(screen.getByTestId('chat-composer-send')).toBeInTheDocument();
  });

  it('TEST-FIA011-02: escribir texto modifica solo draft local y no muta ChatRepository', () => {
    const chat = createChatFlow('enti', 'E1');
    const saveSpy = vi.spyOn(chatRepository, 'save');
    saveSpy.mockClear();
    
    render(<ChatView chatId={chat.id} />);
    const input = screen.getByTestId('chat-composer-input');
    
    fireEvent.change(input, { target: { value: 'Hola mundo' } });
    
    expect(input).toHaveValue('Hola mundo');
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('TEST-FIA011-06: texto vacío no muta ChatRepository', () => {
    const chat = createChatFlow('enti', 'E1');
    const saveSpy = vi.spyOn(chatRepository, 'save');
    saveSpy.mockClear();
    
    render(<ChatView chatId={chat.id} />);
    const sendBtn = screen.getByTestId('chat-composer-send');
    
    fireEvent.click(sendBtn);
    
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('TEST-FIA011-07: texto solo espacios no muta ChatRepository', () => {
    const chat = createChatFlow('enti', 'E1');
    const saveSpy = vi.spyOn(chatRepository, 'save');
    saveSpy.mockClear();
    
    render(<ChatView chatId={chat.id} />);
    const input = screen.getByTestId('chat-composer-input');
    const sendBtn = screen.getByTestId('chat-composer-send');
    
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(sendBtn);
    
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('TEST-FIA011-08: chatId ausente/inexistente no crea Chat implícito ni muta repositorio', () => {
    const snapshotBefore = JSON.stringify(chatRepository.list());
    render(<ChatView chatId="missing" />);
    
    expect(screen.queryByTestId('chat-composer-input')).not.toBeInTheDocument();
    const snapshotAfter = JSON.stringify(chatRepository.list());
    expect(snapshotBefore).toBe(snapshotAfter);
  });

  it('TEST-FIA011-13: forbidden-units scan sin Runtime, etc.', () => {
    const code = fs.readFileSync(path.join(__dirname, '../ChatView.tsx'), 'utf-8');
    expect(code).not.toContain('fetch(');
    expect(code).not.toContain('Runtime');
    expect(code).not.toContain('PromptEngine');
    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('sessionStorage');
    expect(code).not.toContain('receiveResponseToChatFlow');
  });
});
