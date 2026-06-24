import { describe, it, expect } from 'vitest';
import type { SplashTransitionResult } from '../splashTransitionResult';

describe('SplashTransitionResult', () => {
  it('should allow valid transitions', () => {
    const res: SplashTransitionResult = {
      success: true,
      state: 'ready'
    };
    expect(res.success).toBe(true);
    expect(res.state).toBe('ready');
  });
});
