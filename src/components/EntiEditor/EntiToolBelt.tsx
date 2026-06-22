import React, { useState, useRef, useEffect } from 'react';
import { useEntiToolBelt } from './useEntiToolBelt';
import { EntiToolIcon } from './EntiToolIcon';
import './EntiToolBelt.css';

interface Props {
  entiId: string;
}

export const EntiToolBelt: React.FC<Props> = ({ entiId }) => {
  const { tools, toggleAuthorization } = useEntiToolBelt(entiId);
  const [isOpen, setIsOpen] = useState(false);
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

  const authorizedTools = tools.filter(t => t.state === 'authorized' || t.state === 'in_use');

  const handleToggle = (toolId: string) => {
    toggleAuthorization(toolId);
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
        {authorizedTools.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
            {authorizedTools.map(tool => (
              <EntiToolIcon 
                key={tool.id} 
                item={tool} 
                onRemove={() => handleToggle(tool.id)}
              />
            ))}
          </div>
        )}
      </div>
      {isOpen && (
        <ul className="custom-select-options" style={{ position: 'absolute', bottom: '100%', top: 'auto', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px', width: 'max-content', minWidth: '100px', margin: 0, zIndex: 100, padding: '4px 0' }}>
          {tools.map(tool => {
            const isSelected = tool.state === 'authorized' || tool.state === 'in_use';
            const isUnclickable = tool.state === 'controlled_error' || tool.state === 'blocked';
            return (
              <li 
                key={tool.id} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (!isUnclickable) {
                    handleToggle(tool.id); 
                  }
                }}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  opacity: isSelected ? 0.5 : (isUnclickable ? 0.3 : 1), 
                  padding: '4px 10px', 
                  fontSize: '0.75rem', 
                  gap: '8px',
                  cursor: isUnclickable ? 'not-allowed' : 'pointer'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <EntiToolIcon item={tool} />
                  {tool.name}
                </span>
                {isUnclickable && <span style={{ color: 'red', fontSize: '0.8rem' }}>Error</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
