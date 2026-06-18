import React from 'react';
import { EntiToolBeltItemViewModel } from './buildEntiToolBeltViewModel';
import './EntiToolBelt.css';

interface Props {
  item: EntiToolBeltItemViewModel;
}

export const EntiToolIcon: React.FC<Props> = ({ item }) => {
  return (
    <div 
      className={`enti-tool-icon state-${item.state}`} 
      data-testid={`tool-icon-${item.id}`}
      title={`${item.name} - ${item.state === 'blocked' ? item.blockedReason : item.description}`}
    >
      <span className="tool-icon-graphic">🛠️</span>
      <span className="tool-name">{item.name}</span>
      {item.state === 'blocked' && <span className="tool-badge-blocked" data-testid="badge-blocked">🚫</span>}
      {item.state === 'controlled_error' && <span className="tool-badge-error" data-testid="badge-error">⚠️</span>}
    </div>
  );
};
