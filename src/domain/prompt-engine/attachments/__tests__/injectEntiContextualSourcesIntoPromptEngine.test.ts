import { describe, it, expect } from 'vitest';
import { injectEntiContextualSourcesIntoPromptEngine } from '../injectEntiContextualSourcesIntoPromptEngine';
import type { ProviderExecutionInput } from '../../../runtime/provider/ProviderBridge';

describe('injectEntiContextualSourcesIntoPromptEngine', () => {
  const baseInput: ProviderExecutionInput = {
    prompt: 'User prompt here',
    systemPrompt: 'System Prompt here'
  };

  it('injects contextual sources into the user prompt without touching system prompt', () => {
    const block = {
      chatSources: [
        { attachmentId: 'att-1', scope: 'chat_context' as const, contentText: 'Chat Text' }
      ],
      knowledgeSources: [
        { attachmentId: 'att-2', scope: 'enti_knowledge' as const, contentText: 'Knowledge Text' }
      ],
      workMaterialSources: [
        { attachmentId: 'att-3', scope: 'enti_work_material' as const, contentText: 'Work Text' }
      ]
    };const result = injectEntiContextualSourcesIntoPromptEngine(baseInput, block);
    expect(result.status).toBe('success');
    
    // System prompt should remain untouched
    expect(result.injectedInput.systemPrompt).toBe(baseInput.systemPrompt);

    // Context should be injected at the end of the user prompt
    expect(result.injectedInput.prompt).toContain('User prompt here');
    expect(result.injectedInput.prompt).toContain('### CONOCIMIENTOS BASE (Material de consulta pasiva):');
    expect(result.injectedInput.prompt).toContain('Knowledge Text');
    
    expect(result.injectedInput.prompt).toContain('### MATERIAL DE TRABAJO ACTIVO (Analizar o procesar según instrucciones):');
    expect(result.injectedInput.prompt).toContain('Work Text');

    expect(result.injectedInput.prompt).toContain('### ADJUNTOS DEL CHAT (Memoria de la conversación actual):');
    expect(result.injectedInput.prompt).toContain('Chat Text');
  });

  it('returns original input if no sources provided', () => {
    const block = {
      chatSources: [],
      knowledgeSources: [],
      workMaterialSources: []
    };

    const result = injectEntiContextualSourcesIntoPromptEngine(baseInput, block);
    expect(result.status).toBe('success');
    expect(result.injectedInput).toEqual(baseInput);
  });
});
