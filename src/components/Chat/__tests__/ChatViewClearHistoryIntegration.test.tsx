import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatView } from '../ChatView';
import { chatRepository, createChatFlow, sendMessageToChatFlow } from '../../../domain/chat';
import * as fs from 'fs';
import * as path from 'path';

describe('ChatViewClearHistoryIntegration - RV-03/FIA-012', () => {
  beforeEach(() => {
    chatRepository.clear();
    vi.restoreAllMocks();
  });

  it('TEST-FIA012-08: ChatView renderiza estado vacío pasivo sin cerrar Chat', () => {
    const chat = createChatFlow('enti', 'E1');
    sendMessageToChatFlow(chat.id, 'Un mensaje para borrar');
    
    render(<ChatView chatId={chat.id} />);
    
    expect(screen.getByText('Un mensaje para borrar')).toBeInTheDocument();
    
    const clearBtn = screen.getByTestId('chat-view-clear-btn');
    fireEvent.click(clearBtn);
    
    expect(screen.queryByText('Un mensaje para borrar')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-view-empty')).toBeInTheDocument();
    
    // El chat no se cierra, sigue visible su header e input
    expect(screen.getByTestId(`chat-view-${chat.id}`)).toBeInTheDocument();
    expect(screen.getByTestId('chat-composer-input')).toBeInTheDocument();
  });

  it('TEST-FIA012-09: forbidden-units scan contra Runtime, Prompt Engine, SDK/red, backend, autosave, RV-04, RV-05 y FIA-013', () => {
    const codeFlow = fs.readFileSync(path.join(__dirname, '../../../domain/chat/clearChatHistoryFlow.ts'), 'utf-8');
    const codeView = fs.readFileSync(path.join(__dirname, '../ChatView.tsx'), 'utf-8');
    
    expect(codeFlow).not.toContain('Runtime');
    expect(codeFlow).not.toContain('fetch');
    expect(codeFlow).not.toContain('localStorage');
    
    expect(codeView).not.toContain('closeWindow');
    expect(codeView).not.toContain('deleteChat');
  });
});
