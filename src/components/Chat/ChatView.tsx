import React from 'react';
import { chatRepository, getChatHistoryFlow, type Chat } from '../../domain/chat';
import './ChatView.css';

interface ChatViewProps {
  chatId: string;
}

export function ChatView({ chatId }: ChatViewProps) {
  let chat: Chat | null = null;
  let error: string | null = null;

  try {
    const found = chatRepository.getById(chatId);
    if (!found) {
      error = `Chat con id ${chatId} no encontrado`;
    } else {
      chat = found;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) {
    return <div data-testid="chat-view-error" className="chat-view-error">{error}</div>;
  }

  if (!chat) {
    return <div data-testid="chat-view-loading" className="chat-view-loading">Cargando...</div>;
  }

  const history = getChatHistoryFlow(chatId);

  return (
    <div data-testid={`chat-view-${chat.id}`} className="chat-view-container">
      <div data-testid="chat-view-header" className="chat-view-header">
        <span className="chat-view-title">Chat: {chat.id}</span>
        <span className="chat-view-owner" data-testid="chat-view-owner">
          Propietario: {chat.owner?.type} ({chat.owner?.id})
        </span>
      </div>

      <div data-testid="chat-view-history" className="chat-view-history">
        {history.length === 0 ? (
          <div data-testid="chat-view-empty" className="chat-view-empty">
            No hay mensajes en este chat.
          </div>
        ) : (
          history.map((msg, idx) => (
            <div key={`${msg.role}-${idx}`} data-testid="chat-message" className={`chat-message role-${msg.role}`}>
              <span className="chat-message-role">{msg.role}</span>
              <span className="chat-message-content">{msg.content}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
