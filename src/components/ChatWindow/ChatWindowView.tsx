import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ChatWindow } from '../../domain/windowing/ChatWindow';
import { closeChatWindowFlow } from '../../domain/windowing/closeChatWindowFlow';
import type { ChatWindowRegistry } from '../../domain/windowing/ChatWindowRegistry';
import { ChatView } from '../Chat/ChatView';
import { chatRepository, clearChatHistoryFlow } from '../../domain/chat';
import { entiRepository } from '../../domain/enti/entiRepository';
import type { Group } from '../../domain/group/Group';
import './ChatWindow.css';

export interface ChatWindowViewProps {
  windowState: ChatWindow;
  registry: ChatWindowRegistry;
  onStateChange: () => void;
  grupos?: Group[];
}

export function ChatWindowView({ windowState, registry, onStateChange, grupos = [] }: ChatWindowViewProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const externalWindow = useRef<Window | null>(null);
  const isProgrammaticClose = useRef(false);


  useEffect(() => {
    if (windowState.state === 'closed') {
      if (externalWindow.current && !externalWindow.current.closed) {
        isProgrammaticClose.current = true;
        externalWindow.current.close();
      }
      externalWindow.current = null;
      return;
    }

    if (!externalWindow.current || externalWindow.current.closed) {
      isProgrammaticClose.current = false;
      const { width, height, x, y } = windowState.geometry;
      const features = `width=${width},height=${height},left=${x},top=${y}`;
      externalWindow.current = window.open('', `chat-${windowState.windowId}`, features);

      if (externalWindow.current) {
        let initialTitle = `Chat: ${windowState.chatId}`;
        try {
          const chat = chatRepository.getById(windowState.chatId);
          if (chat) {
            if (chat.owner.type === 'enti') {
              const enti = entiRepository.getById(chat.owner.id);
              if (enti) initialTitle = enti.name || 'Entidad sin nombre';
            } else {
              const grupo = grupos.find(g => g.id === chat.owner.id);
              if (grupo) initialTitle = grupo.name || 'Nuevo Grupo';
              else initialTitle = chat.owner.id;
            }
          }
        } catch (e) { console.debug(e); }
        
        const doc = externalWindow.current.document;
        doc.title = initialTitle;

        // Limpiar por si es un remount de StrictMode que reusa la ventana
        doc.body.innerHTML = '';

        const div = doc.createElement('div');
        div.className = 'external-chat-root';
        div.style.width = '100%';
        div.style.height = '100vh';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        doc.body.appendChild(div);

        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(styleEl => {
          doc.head.appendChild(styleEl.cloneNode(true));
        });

        doc.body.style.margin = '0';
        doc.body.style.backgroundColor = 'var(--bg-base, #020617)';

        externalWindow.current.onbeforeunload = () => {
          if (!isProgrammaticClose.current) {
            closeChatWindowFlow(registry, windowState.windowId);
            onStateChange();
          }
        };

        setContainer(div);
      } else {
        console.warn('¡Popup bloqueado! Por favor, permite las ventanas emergentes para abrir el chat en el SO.');
      }
    }

    return () => {
      // Si el componente se desmonta porque ha sido minimizado o cerrado desde la UI principal
      const currentWin = registry.getByWindowId(windowState.windowId);
      if (!currentWin || currentWin.state !== 'visible') {
        if (externalWindow.current && !externalWindow.current.closed) {
          isProgrammaticClose.current = true;
          externalWindow.current.close();
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowState.state, windowState.windowId, windowState.geometry, registry, onStateChange, windowState.chatId]);

  useEffect(() => {
    const handleFocusRequest = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.windowId === windowState.windowId && externalWindow.current) {
        externalWindow.current.focus();
      }
    };
    window.addEventListener('request-focus-window', handleFocusRequest);
    return () => window.removeEventListener('request-focus-window', handleFocusRequest);
  }, [windowState.windowId]);

  useEffect(() => {
    let currentTitle = `Chat: ${windowState.chatId}`;
    try {
      const chat = chatRepository.getById(windowState.chatId);
      if (chat) {
        if (chat.owner.type === 'enti') {
          const enti = entiRepository.getById(chat.owner.id);
          if (enti) currentTitle = enti.name || 'Entidad sin nombre';
        } else {
          const grupo = grupos.find(g => g.id === chat.owner.id);
          if (grupo) currentTitle = grupo.name || 'Nuevo Grupo';
          else currentTitle = chat.owner.id;
        }
      }
    } catch (e) { console.debug(e); }

    if (externalWindow.current && !externalWindow.current.closed) {
      externalWindow.current.document.title = currentTitle;
    }
  }, [windowState.chatId, grupos]);

  // Si no hay contenedor, la ventana fue bloqueada o está cerrada
  if (!container || windowState.state === 'closed') {
    return null;
  }

  let title = `Chat: ${windowState.chatId}`;
  let isGroupChat = false;
  try {
    const chat = chatRepository.getById(windowState.chatId);
    if (chat) {
      if (chat.owner.type === 'enti') {
        const enti = entiRepository.getById(chat.owner.id);
        if (enti) title = enti.name || 'Entidad sin nombre';
      } else {
        isGroupChat = true;
        const grupo = grupos.find(g => g.id === chat.owner.id);
        if (grupo) {
          title = grupo.name || 'Nuevo Grupo';
        } else {
          title = chat.owner.id;
        }
      }
    }
  } catch (e) {
    // Ignorar si el propietario fue eliminado pero la ventana no se ha desmontado aún
    console.debug(e);
  }
  return createPortal(
    <>
      <div className="chat-window-header" style={{ cursor: 'default' }} data-testid={`chat-window-header-${windowState.windowId}`}>
        <div className="chat-window-header-info">
          <span className="chat-window-title">{title}</span>
        </div>
        <div className="chat-window-controls">
          {!isGroupChat && (
            <button 
              className="chat-window-btn clear" 
              title="Vaciar historial"
              onClick={() => {
                clearChatHistoryFlow(windowState.chatId);
                window.dispatchEvent(new CustomEvent('chat-history-cleared', { detail: { chatId: windowState.chatId } }));
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          )}
          {isGroupChat && (
            <button 
              className="chat-window-btn reset" 
              title="Reiniciar Secuencia de Grupo"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('request-group-reset', { detail: { chatId: windowState.chatId } }));
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </button>
          )}
          <button 
            className="chat-window-btn close" 
            data-testid={`close-btn-${windowState.windowId}`}
            onClick={() => {
              if (externalWindow.current) externalWindow.current.close();
            }}
          >✕</button>
        </div>
      </div>
      <div className="chat-window-body">
        <ChatView 
          chatId={windowState.chatId} 
          grupos={grupos}
          onCloseRequest={() => {
            if (externalWindow.current) externalWindow.current.close();
          }}
        />
      </div>
    </>,
    container
  );
}
