import { expect, test } from 'vitest';
import { applyRuntimeStateRestoreGuard } from '../runtimeStateRestoreGuard';
import type { OperationalRestorePayload } from '../../operationalRestore';

test('lifecycleRestoreGuardIntegration ensures no auto-run across the lifecycle', () => {
  const basePayload: OperationalRestorePayload = {
    root: 'operational_restore',
    version: '1.0',
    data: {
      sequencePayload: {
        root: 'sequences',
        version: '1.0',
        data: [{ groupId: 'g1', status: 'running' }]
      }
    }
  };

  const guardedPayload = applyRuntimeStateRestoreGuard(basePayload);
  
  // @ts-expect-error Mocking sequence
  const guardedSeqs = guardedPayload.data.sequencePayload.data;
  expect(guardedSeqs[0].status).toBe('idle'); // Auto-run prevented!
});
