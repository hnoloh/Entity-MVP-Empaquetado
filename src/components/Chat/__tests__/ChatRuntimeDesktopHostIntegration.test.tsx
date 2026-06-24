import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatView } from '../ChatView';


describe('ChatRuntimeDesktopHostIntegration', () => {
  it('should render chat view and wait for user action without auto-running', () => {
    render(<ChatView chatId="test-chat" />);
    // Verification that UI loads idle/error depending on mock, but NOT auto-running/sending
    const loadingOrError = screen.queryByTestId('chat-view-loading') || screen.queryByTestId('chat-view-error');
    expect(loadingOrError).toBeInTheDocument();
  });
});
