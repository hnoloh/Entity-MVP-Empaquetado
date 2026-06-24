import { describe, it, expect } from 'vitest';
import { executeCurrentGroupSlotFlow } from '../executeCurrentGroupSlotFlow';
import type { GroupSequenceInitializationResult } from '../RuntimeExecutionResult';

describe('GroupRuntimeDesktopHostIntegration', () => {
  it('should block execution if explicitUserAction is false', async () => {
    const res = await executeCurrentGroupSlotFlow(
      { groupId: 'g1', chatId: 'c1', currentSlotId: '1', explicitUserAction: false, sequenceState: null as unknown as GroupSequenceInitializationResult },
      [],
      [],
      null,
      undefined
    );
    expect(res.status).toBe('blocked');
  });

  it('should throw controlled error if no initialized sequence state', async () => {
    const res = await executeCurrentGroupSlotFlow(
      { groupId: 'g1', chatId: 'c1', currentSlotId: '1', explicitUserAction: true, sequenceState: null as unknown as GroupSequenceInitializationResult },
      [],
      [],
      null,
      undefined
    );
    expect(res.status).toBe('controlled_error');
  });
});
