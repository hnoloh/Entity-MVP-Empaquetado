import React from 'react';
import type { EntiToolBeltItemViewModel } from './buildEntiToolBeltViewModel';
import './EntiToolBelt.css';

interface Props {
  item: EntiToolBeltItemViewModel;
  onRemove?: () => void;
}

export const EntiToolIcon: React.FC<Props> = ({ item, onRemove }) => {
  const getIcon = () => {
    if (item.kind === 'internet') return <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>;
    if (item.kind === 'local_filesystem') return <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>;
    if (item.kind.includes('pdf') || item.kind.includes('doc')) return <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>;
    return <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.1L7.6 4.8 5.4 7 2.6 4.2c-1.3 2.4-.9 5.4 1.1 7.4 1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l1.6-1.6c.4-.4.4-1.1 0-1.6z"/>;
  };

  return (
    <span 
      className={`enti-tool-tiny-icon state-${item.state}`} 
      data-testid={`tool-icon-${item.id}`}
      title={`${item.name} - ${item.state === 'blocked' ? item.blockedReason : item.description}`}
    >
      <span className="tool-tiny-graphic">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          {getIcon()}
        </svg>
      </span>
      {item.state === 'blocked' && <span className="tool-badge-blocked" data-testid="badge-blocked">🚫</span>}
      {item.state === 'controlled_error' && <span className="tool-badge-error" data-testid="badge-error">⚠️</span>}
      {onRemove && (
        <span className="tool-remove-btn" onClick={(e) => { e.stopPropagation(); onRemove(); }}>✕</span>
      )}
    </span>
  );
};
