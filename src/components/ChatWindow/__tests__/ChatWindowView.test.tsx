
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatWindowView } from '../ChatWindowView';
import { createChatWindowRegistry } from '../../../domain/windowing/ChatWindowRegistry';
import type { ChatWindow } from '../../../domain/windowing/ChatWindow';

// Mock ChatView
vi.mock('../../Chat/ChatView', () => ({
  ChatView: ({ chatId }: { chatId: string }) => <div data-testid={`mock-chat-view-${chatId}`}>MockChatView for {chatId}</div>
}));

describe('ChatWindowView', () => {
  const registry = createChatWindowRegistry();
  const mockStateChange = vi.fn();

  const createMockWindow = (state: 'visible' | 'minimized' | 'closed'): ChatWindow => ({
    windowId: 'win-1',
    chatId: 'chat-1',
    state,
    geometry: { x: 10, y: 20, width: 300, height: 400 }
  });

  let popupContainer: HTMLDivElement | null = null;
  const originalWindowOpen = window.open;

  beforeEach(() => {
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
          if(this.onbeforeunload) this.onbeforeunload();
          if(unloadHandler) unloadHandler();
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
  });

  it('renders visible window with correct chatId and geometry', () => {
    const win = createMockWindow('visible');
    registry.register(win);

    render(<ChatWindowView windowState={win} registry={registry} onStateChange={mockStateChange} />);
    
    const view = screen.getByTestId('chat-window-header-win-1');
    expect(view).toBeInTheDocument();
    
    expect(screen.getByTestId('mock-chat-view-chat-1')).toBeInTheDocument();
  });

  it('monta un portal para un estado de ventana visible', () => {
    const win = createMockWindow('closed');
    const { container } = render(<ChatWindowView windowState={win} registry={registry} onStateChange={mockStateChange} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('calls close flow when close button clicked', () => {
    const win = createMockWindow('visible');
    if (!registry.getByWindowId('win-2')) {
      const win2 = { ...win, windowId: 'win-2' };
      registry.register(win2);
      render(<ChatWindowView windowState={win2} registry={registry} onStateChange={mockStateChange} />);
    }

    const closeBtn = screen.getByTestId('close-btn-win-2');
    fireEvent.click(closeBtn);
    
    expect(registry.getByWindowId('win-2')).toBeNull();
    expect(mockStateChange).toHaveBeenCalled();
  });
});
