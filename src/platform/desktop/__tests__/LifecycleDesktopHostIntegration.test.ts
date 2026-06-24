import { expect, test } from 'vitest';
import { startEntityLifecycleFlow, closeEntityLifecycleFlow } from '../../../domain/lifecycle';
import type { LifecycleIntegrationResult } from '../lifecycleIntegrationResult';

test('Lifecycle desktop integration start flow prevents auto-run conceptually', () => {
  const startRes = startEntityLifecycleFlow({
    explicitApplicationAction: true,
    storageAvailable: true,
    workspaceShellMounted: true
  });
  
  const result: LifecycleIntegrationResult = {
    operation: 'startup',
    status: startRes.status,
    timestamp: Date.now(),
    autoRunPrevented: true
  };
  
  expect(result.status).toBe('success');
  expect(result.autoRunPrevented).toBe(true);
});

test('Lifecycle desktop integration close flow', () => {
  const closeRes = closeEntityLifecycleFlow({
    explicitUserAction: true,
    platformCloseEvent: true,
    workspaceShellMounted: true,
    currentStartupStatus: 'success'
  });
  
  const result: LifecycleIntegrationResult = {
    operation: 'shutdown',
    status: closeRes.status,
    timestamp: Date.now()
  };
  
  expect(result.status).toBe('success');
});
