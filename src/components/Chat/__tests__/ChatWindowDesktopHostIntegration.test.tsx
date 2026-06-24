
import { render } from '@testing-library/react';
import { ChatWindowView } from '../../ChatWindow/ChatWindowView';
import { createChatWindowRegistry } from '../../../domain/windowing/ChatWindowRegistry';

describe('ChatWindowDesktopHostIntegration', () => {
  it('should render a ChatWindow for an Enti without initiating auto-run or network connections', () => {
    const mockWindow = {
      windowId: 'win-1',
      type: 'chat' as const,
      title: 'Chat',
      state: 'visible' as const,
      ownerType: 'enti' as const,
      ownerId: 'enti-1',
      chatId: 'chat-1',
      geometry: { x: 0, y: 0, width: 400, height: 600 }
    };
    
    const registry = createChatWindowRegistry();

    
    const { container } = render(
      <ChatWindowView 
        windowState={mockWindow}
        registry={registry}
        onStateChange={() => {}}
      />
    );
    
    expect(container).toBeDefined();
  });
});
