import React, { useState } from 'react';
import { chatRepository, getChatHistoryFlow, sendMessageToChatFlow, type Chat } from '../../domain/chat';
import { entiRepository } from '../../domain/enti';
import { executeEntiFlow, receiveEntiResponseFlow, OpenAIExecutor, LocalExecutor } from '../../domain/runtime';
import './ChatView.css';

interface ChatViewProps {
  chatId: string;
  onCloseRequest?: () => void;
}

export function ChatView({ chatId }: ChatViewProps) {
  const [draft, setDraft] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [entiStatusText, setEntiStatusText] = useState('Escribiendo...');
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [, setRefreshKey] = useState(0);

  React.useEffect(() => {
    const handleClearEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.chatId === chatId) {
        setRefreshKey(prev => prev + 1);
      }
    };
    window.addEventListener('chat-history-cleared', handleClearEvent);
    return () => window.removeEventListener('chat-history-cleared', handleClearEvent);
  }, [chatId]);

  let chat: Chat | null = null;
  let error: string | null = null;
  let history: ChatMessage[] = [];

  try {
    const found = chatRepository.getById(chatId);
    if (!found) {
      error = `Chat con id ${chatId} no encontrado`;
    } else {
      chat = found;
      history = getChatHistoryFlow(chatId);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  React.useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history.length, isSending]);

  if (error) {
    return <div data-testid="chat-view-error" className="chat-view-error">{error}</div>;
  }

  if (!chat) {
    return <div data-testid="chat-view-loading" className="chat-view-loading">Cargando...</div>;
  }

  let ownerName = 'assistant';
  if (chat.owner.type === 'enti') {
    const targetEnti = entiRepository.getById(chat.owner.id);
    if (targetEnti && targetEnti.name) ownerName = targetEnti.name;
  } else if (chat.owner.type === 'group') {
    ownerName = 'group'; // Placeholder for group chat implementation
  }

  const triggerRuntime = async (targetChatId: string) => {
    const tChat = chatRepository.getById(targetChatId);
    if (!tChat || tChat.owner.type !== 'enti') return;

    const targetEnti = entiRepository.getById(tChat.owner.id);
    if (!targetEnti) return;

    const config = targetEnti.cognitiveConfig;
    let provider;
    if (config.mode === 'cloud' && config.provider === 'openai') {
      provider = new OpenAIExecutor(config.apiKey || '', config.model);
    } else if (config.mode === 'local') {
      provider = new LocalExecutor(config.model || '');
    } else {
      return;
    }

    const execReq = {
      entiId: targetEnti.id,
      chatId: tChat.id,
      explicitUserAction: true,
      targetType: 'ENTI' as const
    };

    setEntiStatusText('Preparando contexto...');
    const resultPromise = executeEntiFlow(execReq, targetEnti, tChat, provider);
    
    const tId = setTimeout(() => setEntiStatusText('Generando respuesta...'), 600);
    const result = await resultPromise;
    clearTimeout(tId);

    if (result.status === 'executed' && result.responseText && result.executionId) {
      setEntiStatusText('Recibiendo...');
      const recReq = {
        ...execReq,
        executionId: result.executionId,
        responseText: result.responseText
      };
      receiveEntiResponseFlow(recReq, targetEnti, tChat);
      
      const event = new CustomEvent('chat-history-cleared', { detail: { chatId: targetChatId } });
      window.dispatchEvent(event);
    } else {
      setRuntimeError(result.error || 'Error desconocido');
    }
  };

  const handleSend = async () => {
    if (draft.trim() === '' || isSending) return;
    
    setRuntimeError(null);
    setIsSending(true);
    sendMessageToChatFlow(chatId, draft.trim());
    setDraft('');
    setIsExpanded(false);
    setRefreshKey(prev => prev + 1);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Disparar Runtime asincrónicamente
    await triggerRuntime(chatId);
    
    setIsSending(false);
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isExpanded) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div data-testid={`chat-view-${chat.id}`} className="chat-view-container">
      <div data-testid="chat-view-history" className="chat-view-history">
        {history.length === 0 ? (
          <div data-testid="chat-view-empty" className="chat-view-empty">
            No hay mensajes en este chat.
          </div>
        ) : (
          history.map((msg, idx) => (
            <div key={`${msg.role}-${idx}`} data-testid="chat-message" className={`chat-message role-${msg.role}`}>
              <span className="chat-message-role">{msg.role === 'assistant' ? ownerName : 'Usuario'}</span>
              <span className="chat-message-content">{msg.content}</span>
            </div>
          ))
        )}
        {isSending && (
          <div className="chat-message role-assistant loading-indicator">
            <span className="chat-message-role">{ownerName}</span>
            <span className="chat-message-content typing">{entiStatusText}</span>
          </div>
        )}
        {runtimeError && (
          <div data-testid="chat-message" className="chat-message role-system">
            <span className="chat-message-role" style={{ color: '#e03131' }}>Sistema (Error)</span>
            <span className="chat-message-content" style={{ color: '#e03131' }}>{runtimeError}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-view-composer" data-testid="chat-view-composer">
        <div className="chat-composer-input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-composer-input"
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            data-testid="chat-composer-input"
            rows={1}
            disabled={isSending}
          />
          <button 
            className="chat-composer-expand-btn"
            onClick={() => setIsExpanded(true)}
            title="Expandir editor"
            disabled={isSending}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </button>
        </div>
        <button 
          className="chat-composer-send" 
          onClick={handleSend}
          data-testid="chat-composer-send"
          disabled={draft.trim() === '' || isSending}
        >
          Enviar
        </button>
      </div>

      {isExpanded && (
        <div className="expanded-field-overlay">
          <div className="expanded-field-content">
            <div className="expanded-field-header">
              <h3>Redactar mensaje ampliado</h3>
              <button onClick={() => setIsExpanded(false)}>✕</button>
            </div>
            <textarea
              className="expanded-textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              disabled={isSending}
            />
            <div className="expanded-field-actions">
              <button onClick={handleSend} disabled={isSending}>Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
