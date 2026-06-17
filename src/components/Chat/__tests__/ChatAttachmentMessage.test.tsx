import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatAttachmentMessage } from '../ChatAttachmentMessage';
import type { ChatAttachmentViewModel } from '../attachmentViewModel';

describe('ChatAttachmentMessage', () => {
  it('renders a valid attachment correctly', () => {
    const vm: ChatAttachmentViewModel = {
      id: 'att-1',
      chatId: 'chat-1',
      name: 'document.pdf',
      extension: 'pdf',
      mimeType: 'application/pdf',
      sizeFormatted: '2.5 MB',
      status: 'renderizable'
    };

    render(<ChatAttachmentMessage attachment={vm} />);
    
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.5 MB')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('renders blocked attachment with error message', () => {
    const vm: ChatAttachmentViewModel = {
      id: 'att-2',
      chatId: 'chat-1',
      name: 'virus.exe',
      extension: 'exe',
      mimeType: 'application/x-msdownload',
      sizeFormatted: '1 MB',
      status: 'blocked'
    };

    render(<ChatAttachmentMessage attachment={vm} />);
    
    expect(screen.getByText('virus.exe')).toBeInTheDocument();
    expect(screen.getByText('Formato no soportado')).toBeInTheDocument();
  });

  it('renders controlled error attachment', () => {
    const vm: ChatAttachmentViewModel = {
      id: 'att-3',
      chatId: 'chat-1',
      name: 'corrupted.docx',
      extension: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeFormatted: '0 B',
      status: 'controlled_error'
    };

    render(<ChatAttachmentMessage attachment={vm} />);
    
    expect(screen.getByText('corrupted.docx')).toBeInTheDocument();
    expect(screen.getByText('Error en el adjunto')).toBeInTheDocument();
  });
});
