import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatAttachmentDropZone } from '../ChatAttachmentDropZone';

describe('ChatAttachmentDropZone', () => {
  it('does not render when idle', () => {
    const { container } = render(<ChatAttachmentDropZone dropState="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders valid drop state background', () => {
    render(<ChatAttachmentDropZone dropState="dragging_valid" />);
    const overlay = screen.getByTestId('chat-drop-zone');
    expect(overlay).toHaveClass('valid');
  });

  it('renders blocked drop state background', () => {
    render(<ChatAttachmentDropZone dropState="dragging_blocked" />);
    const overlay = screen.getByTestId('chat-drop-zone');
    expect(overlay).toHaveClass('blocked');
  });
  
  it('renders processing state loader', () => {
    render(<ChatAttachmentDropZone dropState="dropped" />);
    const overlay = screen.getByTestId('chat-drop-zone');
    expect(overlay).toHaveClass('dropped');
    expect(screen.getByText('Procesando adjunto')).toBeInTheDocument();
  });

  it('renders error state box', () => {
    render(<ChatAttachmentDropZone dropState="error" errorMessage="Custom error message" />);
    const overlay = screen.getByTestId('chat-drop-zone');
    expect(overlay).toHaveClass('error');
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });
});
