import React, { useState } from 'react';
import { useEntiToolBelt } from './useEntiToolBelt';
import { EntiToolIcon } from './EntiToolIcon';
import type { EntiToolBeltItemViewModel } from './buildEntiToolBeltViewModel';
import './EntiToolBelt.css';

interface Props {
  entiId: string;
}

export const EntiToolBelt: React.FC<Props> = ({ entiId }) => {
  const { tools } = useEntiToolBelt(entiId);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTools, setSelectedTools] = useState<EntiToolBeltItemViewModel[]>([]);
  
  if (!entiId || entiId === 'group' || tools.length === 0) return null;

  const toggleTool = (tool: EntiToolBeltItemViewModel) => {
    if (selectedTools.find(t => t.id === tool.id)) {
      setSelectedTools(selectedTools.filter(t => t.id !== tool.id));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  return (
    <div className="field-group" data-testid="enti-tool-belt">
      <div className="field-header" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-start', position: 'relative' }}>
        <label 
          style={{ margin: 0 }}
          className="clickable-label"
          onClick={() => setIsOpen(!isOpen)}
          title="Abrir herramientas"
        >
          Herramientas
        </label>
        {isOpen && (
          <ul className="custom-select-options tool-belt-options" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '4px', minWidth: '180px', margin: 0 }}>
            {tools.map(tool => {
              const isSelected = selectedTools.some(t => t.id === tool.id);
              return (
                <li 
                  key={tool.id} 
                  onClick={(e) => { e.stopPropagation(); toggleTool(tool); setIsOpen(false); }}
                  style={{ display: 'flex', justifyContent: 'space-between', opacity: isSelected ? 0.5 : 1, padding: '6px 12px' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <EntiToolIcon item={tool} />
                    {tool.name}
                  </span>
                  {tool.state === 'blocked' && <span style={{ color: 'red', fontSize: '0.8rem' }}>Bloqueada</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {selectedTools.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
          {selectedTools.map(tool => (
            <EntiToolIcon 
              key={tool.id} 
              item={tool} 
              onRemove={() => toggleTool(tool)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
