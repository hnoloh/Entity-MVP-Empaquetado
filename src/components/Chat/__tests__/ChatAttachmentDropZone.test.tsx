import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatAttachmentDropZone } from '../ChatAttachmentDropZone';

describe('ChatAttachmentDropZone', () => {
  it('does not render when idle', () => {
    const { container } = render(<ChatAttachmentDropZone dropState="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders valid drop state', () => {
    render(<ChatAttachmentDropZone dropState="dragging_valid" />);
    const overlay = screen.getByTestId('chat-drop-zone');
    expect(overlay).toHaveClass('valid');
    expect(screen.getByText('Suelta el archivo para adjuntarlo')).toBeInTheDocument();
  });

  it('renders blocked drop state', () => {
    render(<ChatAttachmentDropZone dropState="dragging_blocked" />);
    const overlay = screen.getByTestId('chat-drop-zone');
    expect(overlay).toHaveClass('blocked');
    expect(screen.getByText('No se puede adjuntar aquí')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<ChatAttachmentDropZone dropState="error" errorMessage="Custom error message" />);
    const overlay = screen.getByTestId('chat-drop-zone');
    expect(overlay).toHaveClass('error');
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });
});
