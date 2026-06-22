import type { ChatAttachmentViewModel } from './attachmentViewModel';

interface ChatAttachmentMessageProps {
  attachment: ChatAttachmentViewModel;
}

export function ChatAttachmentMessage({ attachment }: ChatAttachmentMessageProps) {
  let bgColor = 'rgba(6, 182, 212, 0.1)';
  let borderColor = 'rgba(6, 182, 212, 0.3)';
  let iconColor = '#06b6d4';
  let message = '';

  if (attachment.status === 'blocked') {
    bgColor = 'rgba(168, 85, 247, 0.1)';
    borderColor = 'rgba(168, 85, 247, 0.3)';
    iconColor = '#a855f7';
    message = 'Formato no soportado';
  } else if (attachment.status === 'controlled_error' || attachment.status === 'unavailable_metadata') {
    bgColor = 'rgba(248, 113, 113, 0.1)';
    borderColor = 'rgba(248, 113, 113, 0.3)';
    iconColor = '#f87171';
    message = 'Error en el adjunto';
  }

  return (
    <div 
      className={`chat-attachment-message status-${attachment.status}`}
      data-testid={`attachment-${attachment.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        margin: '8px 0',
        borderRadius: '8px',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        maxWidth: '300px',
        alignSelf: 'flex-end', // Aligned to user side
      }}
    >
      <div 
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: '12px',
          color: iconColor,
          fontWeight: 'bold',
          fontSize: '12px'
        }}
      >
        {(attachment.extension || '?').toUpperCase()}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: '#e2e8f0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }} title={attachment.name}>
          {attachment.name && attachment.name.length > 25 
            ? attachment.name.substring(0, 15) + '...' + attachment.name.substring(attachment.name.length - 8)
            : attachment.name}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          {message ? message : attachment.sizeFormatted}
        </div>
      </div>
    </div>
  );
}
