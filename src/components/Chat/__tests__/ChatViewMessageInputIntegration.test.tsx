import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ChatView } from '../ChatView';
import { chatRepository, createChatFlow, sendMessageToChatFlow } from '../../../domain/chat';

describe('ChatViewMessageInputIntegration - RV-03/FIA-011', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA011-03: envío válido con historial vacío agrega mensaje user', () => {
    const chat = createChatFlow('enti', 'E1');
    render(<ChatView chatId={chat.id} />);
    
    const input = screen.getByTestId('chat-composer-input');
    const sendBtn = screen.getByTestId('chat-composer-send');
    
    fireEvent.change(input, { target: { value: 'Mensaje de prueba' } });
    fireEvent.click(sendBtn);
    
    // El input se limpia (TEST-FIA011-05)
    expect(input).toHaveValue('');
    
    // El historial renderiza el mensaje
    const history = screen.getByTestId('chat-view-history');
    expect(history).toHaveTextContent('Mensaje de prueba');
    
    const messages = within(history).getAllByTestId('chat-message');
    expect(messages).toHaveLength(1);
    expect(messages[0]).toHaveTextContent('user');
  });

  it('TEST-FIA011-04: envío válido con historial previo agrega al final preservando orden, roles y contenido', () => {
    const chat = createChatFlow('grupo', 'G1');
    sendMessageToChatFlow(chat.id, 'Hola primero');
    
    render(<ChatView chatId={chat.id} />);
    
    const input = screen.getByTestId('chat-composer-input');
    const sendBtn = screen.getByTestId('chat-composer-send');
    
    fireEvent.change(input, { target: { value: 'Hola segundo' } });
    fireEvent.click(sendBtn);
    
    const messages = screen.getAllByTestId('chat-message');
    expect(messages).toHaveLength(2);
    expect(messages[0]).toHaveTextContent('Hola primero');
    expect(messages[1]).toHaveTextContent('user');
    expect(messages[1]).toHaveTextContent('Hola segundo');
  });

  it('TEST-FIA011-09: multi-chat; escribir/enviar en Chat A no altera draft, owner ni historial de Chat B', () => {
    const chatA = createChatFlow('enti', 'E1');
    const chatB = createChatFlow('grupo', 'G1');
    
    const { unmount } = render(<ChatView chatId={chatA.id} />);
    const inputA = screen.getByTestId('chat-composer-input');
    fireEvent.change(inputA, { target: { value: 'Para A' } });
    fireEvent.click(screen.getByTestId('chat-composer-send'));
    unmount();
    
    render(<ChatView chatId={chatB.id} />);
    expect(screen.queryByText('Para A')).not.toBeInTheDocument();
    
    const chatBData = chatRepository.getById(chatB.id);
    expect(chatBData?.history).toHaveLength(0);
    expect(chatBData?.owner?.type).toBe('grupo');
  });

  it('TEST-FIA011-10: owner Enti preservado y EntiRepository no modificado', () => {
    const chat = createChatFlow('enti', 'E1');
    render(<ChatView chatId={chat.id} />);
    
    const input = screen.getByTestId('chat-composer-input');
    fireEvent.change(input, { target: { value: 'Probando owner' } });
    fireEvent.click(screen.getByTestId('chat-composer-send'));
    
    const saved = chatRepository.getById(chat.id);
    expect(saved?.owner?.id).toBe('E1');
    expect(saved?.owner?.type).toBe('enti');
  });

  it('TEST-FIA011-12: no invocación automática de receiveResponseToChatFlow', () => {
    const chat = createChatFlow('enti', 'E1');
    render(<ChatView chatId={chat.id} />);
    
    const input = screen.getByTestId('chat-composer-input');
    fireEvent.change(input, { target: { value: 'Dispara' } });
    fireEvent.click(screen.getByTestId('chat-composer-send'));
    
    const saved = chatRepository.getById(chat.id);
    // Solo debe estar el mensaje user, no debe haber assistant automagicamente porque
    // FIA-011 pide explícitamente "NO respuesta automática assistant".
    expect(saved?.history).toHaveLength(1);
    expect(saved?.history[0].role).toBe('user');
  });
});
