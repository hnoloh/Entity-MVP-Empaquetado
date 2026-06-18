import React, { useState, useRef, useEffect } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);
  
  if (!entiId || entiId === 'group' || tools.length === 0) return null;

  const toggleTool = (tool: EntiToolBeltItemViewModel) => {
    if (selectedTools.find(t => t.id === tool.id)) {
      setSelectedTools(selectedTools.filter(t => t.id !== tool.id));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  return (
    <div className="field-group" data-testid="enti-tool-belt" style={{ position: 'relative' }} ref={containerRef}>
      <div className="field-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}>
        <label 
          style={{ margin: 0 }}
          className="clickable-label"
          onClick={() => setIsOpen(!isOpen)}
          title="Abrir herramientas"
        >
          Herramientas
        </label>
        {selectedTools.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
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
      {isOpen && (
        <ul className="custom-select-options" style={{ position: 'absolute', top: 'calc(100% + 4px)', bottom: 'auto', left: '0', marginBottom: '8px', width: 'max-content', minWidth: '100px', margin: 0, zIndex: 100, padding: '4px 0' }}>
          {tools.map(tool => {
            const isSelected = selectedTools.some(t => t.id === tool.id);
            return (
              <li 
                key={tool.id} 
                onClick={(e) => { e.stopPropagation(); toggleTool(tool); setIsOpen(false); }}
                style={{ display: 'flex', justifyContent: 'space-between', opacity: isSelected ? 0.5 : 1, padding: '4px 10px', fontSize: '0.75rem', gap: '8px' }}
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
  );
};
