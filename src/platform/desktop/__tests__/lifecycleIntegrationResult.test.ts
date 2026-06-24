import { expect, test } from 'vitest';
import type { LifecycleIntegrationResult } from '../lifecycleIntegrationResult';

test('LifecycleIntegrationResult interface validates correctly', () => {
  const result: LifecycleIntegrationResult = {
    operation: 'startup',
    status: 'success',
    timestamp: Date.now(),
    autoRunPrevented: true
  };
  expect(result.status).toBe('success');
  expect(result.operation).toBe('startup');

  const resultSplash: LifecycleIntegrationResult = {
    operation: 'splash_transition',
    status: 'success',
    timestamp: Date.now()
  };
  expect(resultSplash.operation).toBe('splash_transition');
});
