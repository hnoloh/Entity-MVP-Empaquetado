import { describe, it, expect } from 'vitest';
import type { SplashLifecycleState } from '../splashLifecycleState';

describe('SplashLifecycleState', () => {
  it('should accept valid states', () => {
    const state1: SplashLifecycleState = 'initializing';
    const state2: SplashLifecycleState = 'checking';
    const state3: SplashLifecycleState = 'ready';
    expect(state1).toBe('initializing');
    expect(state2).toBe('checking');
    expect(state3).toBe('ready');
  });
});
