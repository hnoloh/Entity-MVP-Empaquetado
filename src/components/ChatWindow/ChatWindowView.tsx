import { useState, useRef } from 'react';
import { checkIsTauri } from '../../utils/isTauri';
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
  const [position, setPosition] = useState({ x: windowState.geometry.x, y: windowState.geometry.y });
  const [size, setSize] = useState({ width: windowState.geometry.width, height: windowState.geometry.height });
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const isResizing = useRef(false);
  const resizeStart = useRef({ w: 0, h: 0, x: 0, y: 0 });

  if (checkIsTauri() && window.location.search.indexOf('chatId') === -1) {
    // If we are in the MAIN Tauri window, do not render in-app windows, because they are native OS windows!
    return null;
  }

  if (windowState.state === 'closed') return null;

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
    console.debug(e);
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    registry.focus(windowState.windowId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging.current) {
      isDragging.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
      registry.update({
        ...windowState,
        geometry: { ...windowState.geometry, x: position.x, y: position.y }
      });
    }
  };

  const handleResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isResizing.current = true;
    resizeStart.current = { w: size.width, h: size.height, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    registry.focus(windowState.windowId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (isResizing.current) {
      setSize({
        width: Math.max(300, resizeStart.current.w + (e.clientX - resizeStart.current.x)),
        height: Math.max(200, resizeStart.current.h + (e.clientY - resizeStart.current.y))
      });
    }
  };

  const handleResizeUp = (e: React.PointerEvent) => {
    if (isResizing.current) {
      isResizing.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
      registry.update({
        ...windowState,
        geometry: { ...windowState.geometry, width: size.width, height: size.height }
      });
    }
  };

  const isFocused = registry.getFocusedWindowId() === windowState.windowId;

  return (
    <div 
      className="chat-window-view" 
      style={{ 
        left: position.x, 
        top: position.y, 
        width: size.width, 
        height: size.height,
        zIndex: isFocused ? 1001 : 1000 
      }}
      onPointerDown={() => registry.focus(windowState.windowId)}
    >
      <div 
        className="chat-window-header" 
        data-testid={`chat-window-header-${windowState.windowId}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="chat-window-header-info">
          <span className="chat-window-title">{title}</span>
        </div>
        <div className="chat-window-controls" onPointerDown={e => e.stopPropagation()}>
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
              closeChatWindowFlow(registry, windowState.windowId);
              onStateChange();
            }}
          >✕</button>
        </div>
      </div>
      <div className="chat-window-body">
        <ChatView 
          chatId={windowState.chatId} 
          grupos={grupos}
          onCloseRequest={() => {
            closeChatWindowFlow(registry, windowState.windowId);
            onStateChange();
          }}
        />
        <div 
          className="chat-window-resize-handle" 
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
        />
      </div>
    </div>
  );
}
