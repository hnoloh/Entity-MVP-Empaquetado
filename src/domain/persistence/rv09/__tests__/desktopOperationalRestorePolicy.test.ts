import { expect, test, vi } from 'vitest';
import { enforceDesktopOperationalRestorePolicy } from '../desktopOperationalRestorePolicy';
import * as restore from '../../operationalRestore';

vi.mock('../../operationalRestore', () => ({
  restoreOperationalStateFlow: vi.fn()
}));

test('enforceDesktopOperationalRestorePolicy blocks if no explicit action', () => {
  const res = enforceDesktopOperationalRestorePolicy({ explicitUserAction: false, payload: {} });
  expect(res.status).toBe('blocked');
});

test('enforceDesktopOperationalRestorePolicy validates payload root', () => {
  const res = enforceDesktopOperationalRestorePolicy({ explicitUserAction: true, payload: { root: 'invalid' } });
  expect(res.status).toBe('controlled_error');
});

test('enforceDesktopOperationalRestorePolicy applies guard and calls base restore', () => {
  // @ts-expect-error Mocking module function
  restore.restoreOperationalStateFlow.mockReturnValue({
    status: 'success',
    restoredState: { entis: [] }
  });

  const payload = {
    root: 'operational_restore_rv09',
    version: '1.0',
    basePayload: { root: 'operational_restore', version: '1.0', data: {} },
    multiWindowPayload: { openChats: [] }
  };

  const res = enforceDesktopOperationalRestorePolicy({ explicitUserAction: true, payload });
  expect(res.status).toBe('success');
  expect(res.multiWindowPayload).toBeDefined();
});
