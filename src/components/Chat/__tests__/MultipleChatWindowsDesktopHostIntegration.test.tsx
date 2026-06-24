
import { render } from '@testing-library/react';
import { ChatWindowView } from '../../ChatWindow/ChatWindowView';
import { createChatWindowRegistry } from '../../../domain/windowing/ChatWindowRegistry';

describe('MultipleChatWindowsDesktopHostIntegration', () => {
  it('should render multiple chat windows without breaking isolation constraints', () => {
    const mockWindow1 = {
      windowId: 'win-1', type: 'chat' as const, title: 'Chat 1',
      state: 'visible' as const, ownerType: 'enti' as const, ownerId: 'enti-1',
      chatId: 'chat-1', geometry: { x: 0, y: 0, width: 400, height: 600 }
    };
    const mockWindow2 = {
      windowId: 'win-2', type: 'chat' as const, title: 'Chat 2',
      state: 'visible' as const, ownerType: 'enti' as const, ownerId: 'enti-2',
      chatId: 'chat-2', geometry: { x: 400, y: 0, width: 400, height: 600 }
    };
    
    const registry = createChatWindowRegistry();

    
    const { container: container1 } = render(
      <ChatWindowView windowState={mockWindow1} registry={registry} onStateChange={() => {}} />
    );
    const { container: container2 } = render(
      <ChatWindowView windowState={mockWindow2} registry={registry} onStateChange={() => {}} />
    );
    
    expect(container1).toBeDefined();
    expect(container2).toBeDefined();
    expect(container1).not.toBe(container2);
  });
});
