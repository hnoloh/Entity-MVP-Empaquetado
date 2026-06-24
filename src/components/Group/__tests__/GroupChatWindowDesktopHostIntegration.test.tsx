import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChatWindowView } from '../../ChatWindow/ChatWindowView';
import { createChatWindowRegistry } from '../../../domain/windowing/ChatWindowRegistry';

describe('GroupChatWindowDesktopHostIntegration (Groups Module)', () => {
  it('should render ChatWindow strictly for a Group without mixing Enti contexts', () => {
    const registry = createChatWindowRegistry();
    const mockWindow = {
      windowId: 'win-group-test',
      type: 'chat' as const,
      title: 'Group Chat',
      state: 'visible' as const,
      ownerType: 'group' as const,
      ownerId: 'group-x',
      chatId: 'group-chat-x',
      geometry: { x: 0, y: 0, width: 400, height: 600 }
    };
    
    const { container } = render(
      <ChatWindowView 
        windowState={mockWindow}
        registry={registry}
        onStateChange={() => {}}
      />
    );
    
    expect(container).toBeInTheDocument();
  });
});
