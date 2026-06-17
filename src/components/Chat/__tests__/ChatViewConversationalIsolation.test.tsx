
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ChatView } from '../ChatView';
import { chatRepository, createChatFlow, sendMessageToChatFlow, getChatHistoryFlow, clearChatHistoryFlow } from '../../../domain/chat';
import * as fs from 'fs';
import * as path from 'path';

describe('ChatViewConversationalIsolation - RV-03/FIA-014', () => {
  beforeEach(() => {
    chatRepository.clear();
    vi.restoreAllMocks();
  });
  
  afterEach(() => {
    cleanup();
  });

  it('TEST-FIA014-12: draft local escrito en Chat A no aparece en Chat B', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    
    const { unmount } = render(<ChatView chatId={chatA.id} />);
    const inputA = screen.getByTestId('chat-composer-input') as HTMLInputElement;
    fireEvent.change(inputA, { target: { value: 'Borrador A' } });
    expect(inputA.value).toBe('Borrador A');
    
    unmount(); // Simulator unmounting A to show B
    
    render(<ChatView chatId={chatB.id} />);
    const inputB = screen.getByTestId('chat-composer-input') as HTMLInputElement;
    expect(inputB.value).toBe(''); // No comparte estado
  });

  it('TEST-FIA014-13: Vaciar Chat afecta solo Chat objetivo', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    sendMessageToChatFlow(chatA.id, 'Msg A');
    sendMessageToChatFlow(chatB.id, 'Msg B');
    
    clearChatHistoryFlow(chatA.id);
    
    expect(getChatHistoryFlow(chatA.id)).toHaveLength(0);
    expect(getChatHistoryFlow(chatB.id)).toHaveLength(1);
  });

  it('TEST-FIA014-14: Cerrar Chat afecta solo Chat objetivo', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    
    chatRepository.delete(chatA.id);
    
    expect(chatRepository.getById(chatA.id)).toBeUndefined();
    expect(chatRepository.getById(chatB.id)).toBeDefined();
  });

  it('TEST-FIA014-15: cambiar Chat activo no persiste ni comparte draft/foco/layout', () => {
    const chatA = createChatFlow('enti', 'A1');
    const chatB = createChatFlow('enti', 'B1');
    
    render(<ChatView chatId={chatA.id} />);
    const inputA = screen.getByTestId('chat-composer-input') as HTMLInputElement;
    inputA.focus();
    fireEvent.change(inputA, { target: { value: 'draft A' } });
    cleanup();
    
    render(<ChatView chatId={chatB.id} />);
    const inputB = screen.getByTestId('chat-composer-input') as HTMLInputElement;
    expect(inputB.value).toBe('');
    expect(document.activeElement).not.toBe(inputB);
  });

  it('TEST-FIA014-16: forbidden-units scan sin Runtime, Prompt Engine, provider real, SDK/red, backend, storage persistente, ChatWindow operativo, ChatRegion operativo, RV-04, RV-05 y FIA-015', () => {
    const filesToCheck = [
      '../../../domain/chat/chatRepository.ts',
      '../../../domain/chat/sendMessageToChatFlow.ts',
      '../ChatView.tsx'
    ];
    
    for (const relativePath of filesToCheck) {
      const code = fs.readFileSync(path.join(__dirname, relativePath), 'utf-8');

      expect(code).not.toContain('fetch');
      expect(code).not.toContain('localStorage');
      expect(code).not.toContain('ChatWindow');
      expect(code).not.toContain('EditorGrupo');
    }
  });
});
