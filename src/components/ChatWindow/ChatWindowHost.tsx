import { useState, useEffect } from 'react';
import type { ChatWindowRegistry } from '../../domain/windowing/ChatWindowRegistry';
import { ChatWindowView } from './ChatWindowView';
import './ChatWindow.css';

import type { Group } from '../../domain/group/Group';

export interface ChatWindowHostProps {
  registry: ChatWindowRegistry;
  grupos?: Group[];
}

export function ChatWindowHost({ registry, grupos = [] }: ChatWindowHostProps) {
  const [windows, setWindows] = useState(() => registry.list());

  const updateWindows = () => {
    setWindows(registry.list());
  };

  useEffect(() => {
    const handleUpdate = () => setWindows(registry.list());
    window.addEventListener('chat-windows-updated', handleUpdate);
    const interval = setInterval(handleUpdate, 200);
    return () => {
      window.removeEventListener('chat-windows-updated', handleUpdate);
      clearInterval(interval);
    };
  }, [registry]);

  const visibleWindows = windows.filter(w => w.state === 'visible');

  return (
    <>
      {/* Capa de ventanas visibles */}
      <div className="chat-window-host-layer" data-testid="chat-window-host-layer">
        {visibleWindows.map(win => (
          <ChatWindowView 
            key={win.windowId} 
            windowState={win} 
            registry={registry} 
            onStateChange={updateWindows} 
            grupos={grupos}
          />
        ))}
      </div>
    </>
  );
}
