
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatView } from '../ChatView';
import { chatRepository, createChatFlow } from '../../../domain/chat';
import { entiRepository, createEntiFlow } from '../../../domain/enti';

// Mock dependencies
vi.mock('../../../domain/runtime', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../../domain/runtime')>();
  return {
    ...mod,
    executeEntiFlow: vi.fn().mockResolvedValue({
      status: 'executed',
      executionId: 'mock-exec-id',
      responseText: '[MOCK] Response'
    }),
    receiveEntiResponseFlow: vi.fn(),
    LocalExecutor: class {},
    OpenAIExecutor: class {}
  };
});

import { executeEntiFlow, receiveEntiResponseFlow } from '../../../domain/runtime';

describe('ChatView Runtime Integration', () => {
  beforeEach(() => {
    chatRepository.clear();
    entiRepository.clear();
    vi.clearAllMocks();
  });

  it('TEST-FIA006-01: Chat input explícito dispara Runtime una sola vez', async () => {
    const enti = createEntiFlow();
    enti.cognitiveConfig = { mode: 'local', provider: 'ollama', model: 'llama3' };
    entiRepository.save(enti);

    const chat = createChatFlow('enti', enti.id);
    
    render(<ChatView chatId={chat.id} />);

    const input = screen.getByTestId('chat-composer-input');
    const sendBtn = screen.getByTestId('chat-composer-send');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(sendBtn);
    });

    expect(executeEntiFlow).toHaveBeenCalledTimes(1);
    expect(receiveEntiResponseFlow).toHaveBeenCalledTimes(1);
  });

  it('TEST-FIA006-02: Renderizar ChatView no dispara Runtime', () => {
    const enti = createEntiFlow();
    enti.cognitiveConfig = { mode: 'local', provider: 'ollama', model: 'llama3' };
    entiRepository.save(enti);

    const chat = createChatFlow('enti', enti.id);
    
    render(<ChatView chatId={chat.id} />);

    expect(executeEntiFlow).not.toHaveBeenCalled();
    expect(receiveEntiResponseFlow).not.toHaveBeenCalled();
  });
});
