import type { LLMAutoInstallerState } from '../llmAutoInstallerState';
import { describe, it, expect } from 'vitest';

describe('LLMAutoInstallerState', () => {
  it('should assign valid states correctly', () => {
    const state: LLMAutoInstallerState = 'downloading';
    expect(state).toBe('downloading');
    
    const readyState: LLMAutoInstallerState = 'ready';
    expect(readyState).toBe('ready');
  });
});
