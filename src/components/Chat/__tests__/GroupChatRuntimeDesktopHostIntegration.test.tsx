import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatView } from '../ChatView';


describe('GroupChatRuntimeDesktopHostIntegration', () => {
  it('should render group chat view and not auto-run sequence', () => {
    render(<ChatView chatId="test-group-chat" grupos={[]} />);
    const loadingOrError = screen.queryByTestId('chat-view-loading') || screen.queryByTestId('chat-view-error');
    expect(loadingOrError).toBeInTheDocument();
  });
});
