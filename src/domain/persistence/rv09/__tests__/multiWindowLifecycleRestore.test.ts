import { expect, test, vi } from 'vitest';
import { enforceDesktopOperationalRestorePolicy } from '../desktopOperationalRestorePolicy';
import type { OperationalPersistenceSnapshot_RV09 } from '../operationalPersistenceSnapshot';
import * as restore from '../../operationalRestore';

vi.mock('../../operationalRestore', () => ({
  restoreOperationalStateFlow: vi.fn()
}));

test('multiWindowLifecycleRestore restores open chats without duplicates', () => {
  // @ts-expect-error Mock implementation
  restore.restoreOperationalStateFlow.mockReturnValue({
    status: 'success',
    restoredState: { entis: [] }
  });

  const payload: OperationalPersistenceSnapshot_RV09 = {
    root: 'operational_restore_rv09',
    version: '1.0',
    basePayload: {
      root: 'operational_restore',
      version: '1.0',
      data: {}
    },
    multiWindowPayload: {
      openChats: [
        { chatId: 'chat-1', windowId: 'win-1' },
        { chatId: 'chat-2', windowId: 'win-2' }
      ]
    }
  };

  const restoreRes = enforceDesktopOperationalRestorePolicy({
    explicitUserAction: true,
    payload: payload
  });

  expect(restoreRes.status).toBe('success');
  expect(restoreRes.multiWindowPayload?.openChats.length).toBe(2);
  expect(restoreRes.multiWindowPayload?.openChats[0].chatId).toBe('chat-1');
});
