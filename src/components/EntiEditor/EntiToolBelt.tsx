import React from 'react';
import { useEntiToolBelt } from './useEntiToolBelt';
import { EntiToolIcon } from './EntiToolIcon';
import './EntiToolBelt.css';

interface Props {
  entiId: string;
}

export const EntiToolBelt: React.FC<Props> = ({ entiId }) => {
  const { tools } = useEntiToolBelt(entiId);
  
  if (!entiId || entiId === 'group' || tools.length === 0) return null;

  return (
    <div className="enti-tool-belt" data-testid="enti-tool-belt">
      <h4>Herramientas</h4>
      <div className="tool-belt-container">
        {tools.map(tool => (
          <EntiToolIcon key={tool.id} item={tool} />
        ))}
      </div>
    </div>
  );
};
