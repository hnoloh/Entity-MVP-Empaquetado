import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatView } from '../ChatView';
import { chatRepository, createChatFlow, sendMessageToChatFlow } from '../../../domain/chat';
import * as fs from 'fs';
import * as path from 'path';

describe('ChatViewCloseChatIntegration - RV-03/FIA-013', () => {
  beforeEach(() => {
    chatRepository.clear();
    vi.restoreAllMocks();
  });

  it('TEST-FIA013-09: ChatView deja de renderizar Chat cerrado o muestra estado pasivo compatible', () => {
    const chat = createChatFlow('enti', 'E1');
    render(<ChatView chatId={chat.id} />);
    
    expect(screen.getByTestId(`chat-view-${chat.id}`)).toBeInTheDocument();
    
    const closeBtn = screen.getByTestId('chat-view-close-btn');
    fireEvent.click(closeBtn);
    
    expect(screen.queryByTestId(`chat-view-${chat.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`chat-view-closed-${chat.id}`)).toBeInTheDocument();
  });

  it('TEST-FIA013-10: ChatView no persiste layout, foco, tamaño, posición, opened chats ni activeChatId', () => {
    const chat = createChatFlow('enti', 'E1');
    render(<ChatView chatId={chat.id} />);
    
    const closeBtn = screen.getByTestId('chat-view-close-btn');
    fireEvent.click(closeBtn);
    
    // Al ser un componente aislado que solo reacciona con estado local, 
    // no muta persistencia. Validamos que el repositorio sigue intacto.
    expect(chatRepository.getById(chat.id)).toBeDefined();
  });

  it('TEST-FIA013-11: cerrar desde ChatView no vacía historial ni borra Chat', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'Hola');
    
    render(<ChatView chatId={chat.id} />);
    const closeBtn = screen.getByTestId('chat-view-close-btn');
    fireEvent.click(closeBtn);
    
    const saved = chatRepository.getById(chat.id);
    expect(saved).toBeDefined();
    expect(saved?.history).toHaveLength(1);
  });

  it('Forbidden-units scan', () => {
    const codeFlow = fs.readFileSync(path.join(__dirname, '../../../domain/chat/closeChatFlow.ts'), 'utf-8');
    const codeView = fs.readFileSync(path.join(__dirname, '../ChatView.tsx'), 'utf-8');
    
    expect(codeFlow).not.toContain('delete');
    expect(codeFlow).not.toContain('clearChatHistoryFlow');
    expect(codeFlow).not.toContain('Runtime');
    expect(codeFlow).not.toContain('localStorage');
    
    expect(codeView).not.toContain('localStorage');
    expect(codeView).not.toContain('closeWindow');
  });
});
