import { expect, test } from 'vitest';
import { applyRuntimeStateRestoreGuard } from '../runtimeStateRestoreGuard';
import type { OperationalRestorePayload } from '../../operationalRestore';

test('applyRuntimeStateRestoreGuard turns running sequences to idle', () => {
  const basePayload: OperationalRestorePayload = {
    root: 'operational_restore',
    version: '1.0',
    data: {
      sequencePayload: {
        root: 'sequences',
        version: '1.0',
        data: [
          { groupId: 'g1', status: 'running' },
          { groupId: 'g2', status: 'idle' }
        ]
      }
    }
  };

  const result = applyRuntimeStateRestoreGuard(basePayload);
  
  // @ts-expect-error Bypass unknown cast for test validation
  const seqs = result.data.sequencePayload.data;
  expect(seqs[0].status).toBe('idle');
  expect(seqs[1].status).toBe('idle');
});

test('applyRuntimeStateRestoreGuard does nothing if sequencePayload is missing', () => {
  const basePayload: OperationalRestorePayload = {
    root: 'operational_restore',
    version: '1.0',
    data: {}
  };
  const result = applyRuntimeStateRestoreGuard(basePayload);
  expect(result).toEqual(basePayload);
});
