import { QWEN_2_5_0_5B_STARTER } from '../localStarterModelDescriptor';
import { describe, it, expect } from 'vitest';

describe('LocalStarterModelDescriptor', () => {
  it('should define the Qwen 2.5 0.5B starter pack with correct properties', () => {
    expect(QWEN_2_5_0_5B_STARTER.id).toBe('qwen2.5-0.5b');
    expect(QWEN_2_5_0_5B_STARTER.name).toBe('Qwen 2.5 0.5B');
    expect(QWEN_2_5_0_5B_STARTER.filename).toBe('qwen2.5-0.5b-instruct-q4_k_m.gguf');
    expect(QWEN_2_5_0_5B_STARTER.expectedSize).toBeGreaterThan(0);
    expect(QWEN_2_5_0_5B_STARTER.url).toContain('https://');
  });
});
