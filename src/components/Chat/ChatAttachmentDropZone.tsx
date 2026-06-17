
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
  let showBox = false;
  let showProcessing = false;

  switch (dropState) {
    case 'dragging_valid':
      overlayClass += ' valid';
      bgColor = 'rgba(6, 182, 212, 0.15)'; // fondo tintado cian
      break;
    case 'dragging_blocked':
      overlayClass += ' blocked';
      bgColor = 'rgba(168, 85, 247, 0.15)'; // fondo tintado morado acianado
      break;
    case 'dropped':
      overlayClass += ' dropped';
      showProcessing = true;
      bgColor = 'transparent'; // No oscurecemos mientras procesa
      break;
    case 'error':
      overlayClass += ' error';
      message = errorMessage || 'Error al procesar el archivo';
      color = '#a855f7'; // morado acianado
      bgColor = 'rgba(168, 85, 247, 0.15)'; // fondo tintado morado
      showBox = true;
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
      {showBox && (
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
      )}

      {showProcessing && (
        <div
          data-testid={`drop-zone-state-${dropState}`}
          style={{
            position: 'absolute',
            bottom: '80px', // Justo por encima del área del input
            left: '20px',
            color: '#06b6d4',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            padding: '6px 14px',
            borderRadius: '20px',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontWeight: 500
          }}
        >
          <span className="processing-text">Procesando adjunto</span>
          <span className="processing-dots"></span>
        </div>
      )}

      <style>
        {`
          @keyframes dropZoneDots {
            0%, 20% { content: "."; }
            40% { content: ".."; }
            60%, 100% { content: "..."; }
          }
          .processing-dots::after {
            content: "";
            animation: dropZoneDots 1.5s infinite steps(1);
            display: inline-block;
            width: 12px;
            text-align: left;
          }
        `}
      </style>
    </div>
  );
}
