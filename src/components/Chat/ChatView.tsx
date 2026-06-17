import React, { useState, useSyncExternalStore, useRef, useEffect } from 'react';
import { chatRepository, sendMessageToChatFlow, type Chat } from '../../domain/chat';
import { entiRepository } from '../../domain/enti';
import { executeEntiFlow, receiveEntiResponseFlow, OpenAIExecutor, LocalExecutor } from '../../domain/runtime';
import { useGroupSequenceRuntimeAdapter } from '../../ui/groupSequence/useGroupSequenceRuntimeAdapter';
import type { Group } from '../../domain/group/Group';
import './ChatView.css';

interface ChatViewProps {
  chatId: string;
  onCloseRequest?: () => void;
  grupos?: Group[];
}

export function ChatView({ chatId, grupos }: ChatViewProps) {
  const [draft, setDraft] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [entiStatusText, setEntiStatusText] = useState('Escribiendo...');
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const foundChat = useSyncExternalStore(
    chatRepository.subscribe,
    () => chatRepository.getSnapshot(chatId)
  );

  const chat: Chat | null = foundChat || null;
  let error: string | null = null;
  const history = chat ? chat.history : [];

  if (!chat) {
    error = `Chat con id ${chatId} no encontrado`;
  }

  const isGroup = chat ? (chat.owner.type === 'grupo') : false;
  const groupAdapter = useGroupSequenceRuntimeAdapter(
    isGroup && chat ? chat.owner.id : '',
    chatId,
    grupos || [],
    chatRepository,
    entiRepository
  );

  // La reactividad está delegada a useSyncExternalStore
  React.useEffect(() => {
    if (isGroup && !groupAdapter.isExecuting) {
      if (groupAdapter.uiState === 'sequence_initialized' || groupAdapter.uiState === 'advanced') {
        groupAdapter.actions.executeCurrentSlot();
      }
    }
  }, [isGroup, groupAdapter.uiState, groupAdapter.isExecuting, groupAdapter.actions]);

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history.length, isSending]);

  useEffect(() => {
    if (!isGroup) return;
    const handleResetRequest = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.chatId === chatId) {
        groupAdapter.actions.reset();
      }
    };
    window.addEventListener('request-group-reset', handleResetRequest);
    return () => window.removeEventListener('request-group-reset', handleResetRequest);
  }, [chatId, isGroup, groupAdapter.actions]);

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
  } else if (chat.owner.type === 'grupo') {
    ownerName = 'Grupo'; // Placeholder for group chat implementation
  }

  let currentExecutingEntiName = 'Grupo';
  if (isGroup && groupAdapter.isExecuting && groupAdapter.sequenceState?.currentSlotId) {
    const currentGroup = grupos ? grupos.find(g => g.id === chat.owner.id) : null;
    if (currentGroup && currentGroup.slots) {
      const entiId = currentGroup.slots[groupAdapter.sequenceState.currentSlotId as keyof typeof currentGroup.slots];
      if (entiId) {
        const enti = entiRepository.getById(entiId);
        if (enti && enti.name) {
          currentExecutingEntiName = enti.name;
        }
      }
    }
  }
  
  const showLoadingBubble = isSending || (isGroup && groupAdapter.isExecuting);
  const loadingRoleName = (isGroup && groupAdapter.isExecuting) ? currentExecutingEntiName : ownerName;
  const loadingStatusText = (isGroup && groupAdapter.isExecuting) ? 'Procesando...' : entiStatusText;

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
      
      // Reactividad delegada al repositorio al completarse el flujo
    } else {
      setRuntimeError(result.error || 'Error desconocido');
    }
  };

  const handleSend = async () => {
    if (draft.trim() === '' || isSending) return;
    
    setRuntimeError(null);
    setIsSending(true);

    const messageToSend = draft.trim();

    if (isGroup && groupAdapter.uiState === 'idle') {
      groupAdapter.actions.initialize();
    }

    sendMessageToChatFlow(chatId, messageToSend);
    setDraft('');
    setIsExpanded(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    if (isGroup) {
      if (groupAdapter.uiState === 'slot_executed') {
        // Enviar la corrección al siguiente Enti saltándose la respuesta del actual
        groupAdapter.actions.macroAdvanceWithCorrection(messageToSend);
      } else if (groupAdapter.uiState !== 'idle') {
        // Re-ejecutar el slot si estaba en otro estado
        groupAdapter.actions.executeCurrentSlot();
      }
    } else {
      // Disparar Runtime asincrónicamente solo para Entis
      await triggerRuntime(chatId);
    }
    
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
          (function() {
            let assistantCount = 0;
            const currentGroup = isGroup && grupos ? grupos.find(g => g.id === chat.owner.id) : null;
            
            return history.map((msg, idx) => {
              let currentOwnerName = msg.role === 'assistant' ? ownerName : msg.role === 'system' ? 'Sistema' : 'Usuario';
              if (msg.role === 'assistant') {
                assistantCount++;
                if (currentGroup && currentGroup.slots) {
                  const slotId = assistantCount.toString();
                  const entiId = currentGroup.slots[slotId as keyof typeof currentGroup.slots];
                  if (entiId) {
                    const enti = entiRepository.getById(entiId);
                    if (enti && enti.name) {
                      currentOwnerName = enti.name;
                    }
                  }
                }
              }

              return (
                <div key={`${msg.role}-${idx}`} data-testid="chat-message" className={`chat-message role-${msg.role}`}>
                  <span className="chat-message-role">{currentOwnerName}</span>
                  <span className="chat-message-content">{msg.content}</span>
                </div>
              );
            });
          })()
        )}
        {showLoadingBubble && (
          <div className="chat-message role-assistant loading-indicator">
            <span className="chat-message-role">{loadingRoleName}</span>
            <span className="chat-message-content typing">{loadingStatusText}</span>
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
        {isGroup && groupAdapter.error && (
          <div data-testid="group-sequence-error" style={{ width: '100%', color: '#ff5757', marginBottom: '4px', fontSize: '12px', background: 'rgba(255, 87, 87, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 87, 87, 0.2)' }}>
            Error: {groupAdapter.error}
          </div>
        )}
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
        <div className="chat-composer-actions">
          {isGroup && groupAdapter.uiState === 'slot_executed' && (
            <button className="chat-composer-validate-btn" onClick={groupAdapter.actions.macroValidateAndAdvance} data-testid="btn-validar-macro">Validar</button>
          )}
          {isGroup && groupAdapter.uiState === 'completed' && (
            <button className="chat-composer-validate-btn" disabled style={{ opacity: 0.5 }} data-testid="btn-validar-macro-opaco">Validar</button>
          )}
          <button 
            className="chat-composer-send" 
            onClick={handleSend}
            data-testid="chat-composer-send"
            disabled={draft.trim() === '' || isSending}
          >
            Enviar
          </button>
        </div>
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
