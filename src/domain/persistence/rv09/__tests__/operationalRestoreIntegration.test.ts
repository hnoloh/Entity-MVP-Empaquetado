import { expect, test } from 'vitest';
import { enforceDesktopOperationalPersistencePolicy } from '../desktopOperationalPersistencePolicy';
import { enforceDesktopOperationalRestorePolicy } from '../desktopOperationalRestorePolicy';
import { entiRepository } from '../../../enti/entiRepository';

test('RV09 Persistence and Restore Integration flow', () => {
  entiRepository.clear();
  entiRepository.save({
    id: 'test-enti-1',
    name: 'Test',
    type: 'enti',
    status: 'incomplete',
    harness: { function: '', rules: [], workMaterial: '', knowledge: '' },
    cognitiveConfig: { mode: 'unconfigured' }
  });

  const persistRes = enforceDesktopOperationalPersistencePolicy({
    explicitUserAction: true,
    baseRequest: {
      explicitUserAction: true,
      action: 'persist',
      mode: 'full',
      entis: entiRepository.list(),
      groups: [],
      chats: [],
      sequences: [],
      positions: [],
      toolAuthorizations: []
    },
    multiWindowPayload: { openChats: [{ chatId: 'c1', windowId: 'w1' }] }
  });

  expect(persistRes.status).toBe('success');

  entiRepository.clear();

  const restoreRes = enforceDesktopOperationalRestorePolicy({
    explicitUserAction: true,
    payload: persistRes.payload
  });

  expect(restoreRes.status).toBe('success');
  expect(restoreRes.restoredState?.entis?.length).toBe(1);
  expect(restoreRes.multiWindowPayload?.openChats[0].chatId).toBe('c1');
});
