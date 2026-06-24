import { createSizeIntegrityPolicy } from '../starterModelIntegrityPolicy';
import { QWEN_2_5_0_5B_STARTER } from '../localStarterModelDescriptor';
import { describe, it, expect } from 'vitest';

describe('StarterModelIntegrityPolicy', () => {
  it('should validate correctly when size is within tolerance', () => {
    const policy = createSizeIntegrityPolicy(5000000);
    const isValid = policy.validate(QWEN_2_5_0_5B_STARTER, QWEN_2_5_0_5B_STARTER.expectedSize - 1000);
    expect(isValid).toBe(true);
  });

  it('should reject when size differs by more than tolerance', () => {
    const policy = createSizeIntegrityPolicy(5000000);
    const isValid = policy.validate(QWEN_2_5_0_5B_STARTER, QWEN_2_5_0_5B_STARTER.expectedSize - 10000000);
    expect(isValid).toBe(false);
  });
});
