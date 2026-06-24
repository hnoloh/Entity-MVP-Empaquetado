import { expect, test, vi } from 'vitest';
import { enforceDesktopOperationalPersistencePolicy } from '../desktopOperationalPersistencePolicy';
import * as harness from '../../persistenceHarness';

vi.mock('../../persistenceHarness', () => ({
  runPersistenceHarnessFlow: vi.fn()
}));

test('enforceDesktopOperationalPersistencePolicy blocks if no explicit action', () => {
  const res = enforceDesktopOperationalPersistencePolicy({
    explicitUserAction: false,
    baseRequest: { explicitUserAction: false, action: 'persist', mode: 'full' }
  });
  expect(res.status).toBe('blocked');
});

test('enforceDesktopOperationalPersistencePolicy calls base harness and wraps payload', () => {
  // @ts-expect-error Mocking module function
  harness.runPersistenceHarnessFlow.mockReturnValue({
    status: 'success',
    entiPayload: { foo: 'bar' }
  });

  const res = enforceDesktopOperationalPersistencePolicy({
    explicitUserAction: true,
    baseRequest: { explicitUserAction: true, action: 'persist', mode: 'full' },
    multiWindowPayload: { openChats: [{ chatId: 'c1', windowId: 'w1' }] }
  });

  expect(res.status).toBe('success');
  expect(res.payload?.root).toBe('operational_restore_rv09');
  expect(res.payload?.multiWindowPayload?.openChats[0].chatId).toBe('c1');
});
