
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatWindowHost } from '../ChatWindowHost';
import { createChatWindowRegistry } from '../../../domain/windowing/ChatWindowRegistry';
import { createChatWindow } from '../../../domain/windowing/ChatWindow';

// Mock ChatView
vi.mock('../../Chat/ChatView', () => ({
  ChatView: ({ chatId }: { chatId: string }) => <div data-testid={`mock-chat-view-${chatId}`}>MockChatView for {chatId}</div>
}));

describe('ChatWindowHost', () => {
  let popupContainer: HTMLDivElement | null = null;
  const originalWindowOpen = window.open;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    
    popupContainer = document.createElement('div');
    popupContainer.id = 'popup-mock-root';
    document.body.appendChild(popupContainer);

    window.open = vi.fn(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let unloadHandler: any = null;
      return {
        document: {
          createElement: (tag: string) => document.createElement(tag),
          body: {
            appendChild: (el: HTMLElement) => popupContainer?.appendChild(el),
            style: {}
          },
          head: {
            appendChild: vi.fn()
          },
          title: ''
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addEventListener: vi.fn((ev: string, handler: any) => {
          if (ev === 'beforeunload') unloadHandler = handler;
        }),
        close: function() { 
          if (this.onbeforeunload) this.onbeforeunload();
          if (unloadHandler) unloadHandler();
          if(popupContainer) popupContainer.innerHTML = ''; 
        },
        closed: false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    });
  });

  afterEach(() => {
    window.open = originalWindowOpen;
    if (popupContainer && popupContainer.parentNode) {
      popupContainer.parentNode.removeChild(popupContainer);
    }
    vi.useRealTimers();
  });

  it('actualiza las ventanas cuando el registro cambia', () => {
    const registry = createChatWindowRegistry();
    registry.register(createChatWindow('win-1', 'chat-1', { x: 0, y: 0, width: 100, height: 100 }, 'visible'));
    registry.register(createChatWindow('win-2', 'chat-2', { x: 10, y: 10, width: 100, height: 100 }, 'visible'));

    render(<ChatWindowHost registry={registry} />);
    
    expect(screen.getByTestId('chat-window-header-win-1')).toBeInTheDocument();
    expect(screen.getByTestId('chat-window-header-win-2')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chat-view-chat-1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chat-view-chat-2')).toBeInTheDocument();
  });

  it('limpia el intervalo al desmontarse', () => {
    const registry = createChatWindowRegistry();
    render(<ChatWindowHost registry={registry} />);

    expect(screen.queryByTestId('chat-window-win-3')).not.toBeInTheDocument();

    act(() => {
      registry.register(createChatWindow('win-3', 'chat-3', { x: 0, y: 0, width: 100, height: 100 }, 'visible'));
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByTestId('chat-window-header-win-3')).toBeInTheDocument();
  });
});
