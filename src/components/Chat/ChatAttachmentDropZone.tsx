import React from 'react';
import type { AttachmentDropState } from './useChatAttachmentDrop';

interface ChatAttachmentDropZoneProps {
  dropState: AttachmentDropState;
  errorMessage?: string | null;
}

export function ChatAttachmentDropZone({ dropState, errorMessage }: ChatAttachmentDropZoneProps) {
  if (dropState === 'idle') return null;

  let overlayClass = 'chat-drop-zone-overlay';
  let message = '';
  let color = '#fff';
  let bgColor = 'rgba(0,0,0,0.7)';

  switch (dropState) {
    case 'dragging_valid':
      overlayClass += ' valid';
      message = 'Suelta el archivo para adjuntarlo';
      color = '#4ade80'; // verde
      bgColor = 'rgba(20, 50, 20, 0.85)';
      break;
    case 'dragging_blocked':
      overlayClass += ' blocked';
      message = 'No se puede adjuntar aquí';
      color = '#f87171'; // rojo
      bgColor = 'rgba(50, 20, 20, 0.85)';
      break;
    case 'dropped':
      overlayClass += ' dropped';
      message = 'Procesando adjunto...';
      color = '#60a5fa'; // azul
      break;
    case 'error':
      overlayClass += ' error';
      message = errorMessage || 'Error al procesar el archivo';
      color = '#f87171';
      break;
  }

  return (
    <div 
      className={overlayClass} 
      data-testid="chat-drop-zone" 
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: bgColor,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        pointerEvents: 'none' // Esto es crucial para que el mouse siga detectando los eventos del contenedor inferior
      }}
    >
      <div 
        className="chat-drop-zone-content" 
        data-testid={`drop-zone-state-${dropState}`}
        style={{
          padding: '24px 32px',
          backgroundColor: '#222',
          color: color,
          borderRadius: '12px',
          border: `2px dashed ${color}`,
          pointerEvents: 'none',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontWeight: 'bold',
          fontSize: '16px'
        }}
      >
        <div className="chat-drop-zone-message">{message}</div>
      </div>
    </div>
  );
}
