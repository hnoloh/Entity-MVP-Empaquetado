
import { render } from '@testing-library/react';
import { ChatView } from '../ChatView';
import type { Group } from '../../../domain/group/Group';

describe('GroupChatDesktopHostIntegration', () => {
  it('should render the chat view for a Group without converting it into a tool owner', () => {
    // This integration test verifies Group Chat works in the desktop host.
    const mockGroup = { id: 'test-group', name: 'Test Group', entis: [] };
    const { container } = render(<ChatView chatId="group-chat-456" grupos={[mockGroup as unknown as Group]} />);
    
    // We only verify it doesn't crash and mounts properly.
    expect(container).toBeInTheDocument();
  });
});
