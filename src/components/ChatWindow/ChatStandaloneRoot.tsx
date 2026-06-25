import { useEffect, useState } from 'react';
import { ChatView } from '../Chat/ChatView';
import { syncChannel } from '../../platform/desktop/MultiWindowSync';
import { chatRepository } from '../../domain/chat/chatRepository';
import { entiRepository } from '../../domain/enti/entiRepository';
import type { Group } from '../../domain/group/Group';
import type { Chat } from '../../domain/chat/Chat';
import type { Enti } from '../../domain/enti/Enti';
import { clearChatHistoryFlow } from '../../domain/chat/clearChatHistoryFlow';
import { WindowResizeHandles } from '../Titlebar/WindowResizeHandles';
import './ChatWindow.css';

export function ChatStandaloneRoot({ chatId }: { chatId: string }) {
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [ready, setReady] = useState(false);
  
  // Force re-render when enti updates
  const [, setEntiUpdateTrigger] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appWindow, setAppWindow] = useState<any>(null);

  useEffect(() => {
    import('../../utils/isTauri').then(({ checkIsTauri }) => {
      if (checkIsTauri()) {
        import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
          setAppWindow(getCurrentWindow());
        });
      }
    });
  }, []);

  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data.type === 'full_state') {
        e.data.entis.forEach((en: Enti) => entiRepository.saveSilent(en));
        e.data.chats.forEach((ch: Chat) => chatRepository.saveSilent(ch));
        setGrupos(e.data.grupos);
        setReady(true);
      } else if (e.data.type === 'chat_updated') {
        chatRepository.saveSilent(e.data.chat);
      } else if (e.data.type === 'enti_updated') {
        entiRepository.saveSilent(e.data.enti);
        setEntiUpdateTrigger(prev => prev + 1);
      } else if (e.data.type === 'grupos_updated') {
        setGrupos(e.data.grupos);
      } else if (e.data.type === 'app_closing') {
        import('../../utils/isTauri').then(({ checkIsTauri }) => {
          if (checkIsTauri()) {
            import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
              getCurrentWindow().close();
            });
          } else {
            window.close();
          }
        });
      }
    };
    syncChannel.addEventListener('message', handleMsg);
    
    // Request state from main window
    syncChannel.postMessage({ type: 'request_full_state' });

    // In case main window was not ready, try again periodically until ready
    const interval = setInterval(() => {
      if (!ready) syncChannel.postMessage({ type: 'request_full_state' });
    }, 1000);

    return () => {
      syncChannel.removeEventListener('message', handleMsg);
      clearInterval(interval);
    };
  }, [ready]);

  let computedTitle = 'Chat';
  const chat = chatRepository.getById(chatId);
  if (chat) {
    if (chat.owner.type === 'enti') {
      const enti = entiRepository.getById(chat.owner.id);
      if (enti) computedTitle = enti.name;
    } else {
      const grupo = grupos.find(g => g.id === chat.owner.id);
      if (grupo) computedTitle = grupo.name;
    }
  }

  useEffect(() => {
    // Dynamic title update
    if (ready) {
      import('../../utils/isTauri').then(({ checkIsTauri }) => {
        if (checkIsTauri()) {
          import('@tauri-apps/api/window').then(async ({ getCurrentWindow }) => {
            const win = getCurrentWindow();
            win.setTitle(computedTitle);
            
            // Just show the window. It is centered natively via openChatWindowFlow.
            // Do not reposition it here, or it will jump around when title changes or on reload.
            win.show();
          });
        }
      });
    }
  }, [ready, computedTitle]); // We also need to listen to entiRepository updates for the title.

  const handleCloseOS = () => {
    if (appWindow) {
      appWindow.close().catch(() => window.close());
    } else {
      window.close();
    }
  };

  const handleClearChat = () => {
    const updated = clearChatHistoryFlow(chatId);
    if (updated) {
      syncChannel.postMessage({ type: 'chat_updated', chat: updated });
      window.dispatchEvent(new CustomEvent('chat-history-cleared', { detail: { chatId } }));
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent' }}>
      <WindowResizeHandles />
      
      {/* Franja del chat */}
      <div 
        data-tauri-drag-region="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '40px',
          background: 'linear-gradient(180deg, rgba(2, 6, 23, 1) 0%, rgba(2, 6, 23, 0.9) 100%)',
          borderBottom: '1px solid rgba(0, 229, 255, 0.15)',
          padding: '0 16px',
          userSelect: 'none',
          flexShrink: 0,
          cursor: 'grab'
        }}
      >
        <div 
          style={{ 
            color: '#00e5ff', 
            fontSize: '13px', 
            fontWeight: 500, 
            pointerEvents: 'none',
            letterSpacing: '0.5px'
          }}
        >
          {computedTitle}
        </div>
        <div style={{ display: 'flex', gap: '8px', zIndex: 9999 }} className="no-drag">
          <button onClick={handleClearChat} className="window-btn clear-btn" title="Vaciar chat">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
          <button onClick={handleCloseOS} className="window-btn close-btn" title="Cerrar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {ready ? (
          <ChatView chatId={chatId} grupos={grupos} onCloseRequest={() => window.close()} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e5ff' }}>
            Iniciando conexión...
          </div>
        )}
      </div>
    </div>
  );
}
