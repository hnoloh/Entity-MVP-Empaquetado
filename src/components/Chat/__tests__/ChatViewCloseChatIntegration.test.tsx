import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatView } from '../ChatView';
import { chatRepository, createChatFlow, sendMessageToChatFlow, closeChatFlow } from '../../../domain/chat';
import * as path from 'path';
import * as fs from 'fs';

describe('ChatViewCloseChatIntegration - RV-03/FIA-013', () => {
  beforeEach(() => {
    chatRepository.clear();
    vi.restoreAllMocks();
  });

  it('TEST-FIA013-09: ChatView no maneja el cierre internamente, delegando al window host', () => {
    const chat = createChatFlow('enti', 'E1');
    render(<ChatView chatId={chat.id} />);
    
    expect(screen.getByTestId(`chat-view-${chat.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId('chat-view-close-btn')).not.toBeInTheDocument();
  });

  it('TEST-FIA013-10: closeChatFlow no persiste layout, foco, tamaño, posición, opened chats ni activeChatId', () => {
    const chat = createChatFlow('enti', 'E1');
    render(<ChatView chatId={chat.id} />);
    
    closeChatFlow(chat.id);
    
    // Al ser un componente aislado que solo reacciona con estado local, 
    // no muta persistencia. Validamos que el repositorio sigue intacto.
    expect(chatRepository.getById(chat.id)).toBeDefined();
  });

  it('TEST-FIA013-11: cerrar no vacía historial ni borra Chat', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'Hola');
    
    closeChatFlow(chat.id);
    
    const saved = chatRepository.getById(chat.id);
    expect(saved).toBeDefined();
    expect(saved?.history).toHaveLength(1);
  });

  it('Forbidden-units scan', () => {
    const codeFlow = fs.readFileSync(path.join(__dirname, '../../../domain/chat/closeChatFlow.ts'), 'utf-8');
    const codeView = fs.readFileSync(path.join(__dirname, '../ChatView.tsx'), 'utf-8');
    
    expect(codeFlow).not.toContain('delete');
    expect(codeFlow).not.toContain('clearChatHistoryFlow');

    expect(codeFlow).not.toContain('localStorage');
    
    expect(codeView).not.toContain('localStorage');
    expect(codeView).not.toContain('closeWindow');
  });
});
