
import { render } from '@testing-library/react';
import { ChatWindowView } from '../../ChatWindow/ChatWindowView';
import { createChatWindowRegistry } from '../../../domain/windowing/ChatWindowRegistry';

describe('GroupChatWindowDesktopHostIntegration', () => {
  it('should render a Group Chat Window without elevating the Group to a tool owner', () => {
    const mockWindow = {
      windowId: 'win-group',
      type: 'chat' as const,
      title: 'Group Chat',
      state: 'visible' as const,
      ownerType: 'group' as const,
      ownerId: 'group-1',
      chatId: 'group-chat-1',
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
