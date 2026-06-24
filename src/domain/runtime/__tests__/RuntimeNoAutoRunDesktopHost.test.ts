import { describe, it, expect } from 'vitest';
import { executeEntiFlow } from '../executeEntiFlow';
import { executeCurrentGroupSlotFlow } from '../executeCurrentGroupSlotFlow';
import type { GroupSequenceInitializationResult } from '../RuntimeExecutionResult';

describe('RuntimeNoAutoRunDesktopHost', () => {
  it('EntiFlow ensures explicitUserAction is required', async () => {
    const res = await executeEntiFlow({ entiId: '1', chatId: '1', explicitUserAction: false, targetType: 'ENTI' }, null, null);
    expect(res.status).toBe('blocked');
    expect(res.error).toContain('explicit user action');
  });
  
  it('GroupFlow ensures explicitUserAction is required', async () => {
    const res = await executeCurrentGroupSlotFlow(
      { groupId: '1', chatId: '1', currentSlotId: '1', explicitUserAction: false, sequenceState: null as unknown as GroupSequenceInitializationResult },
      [], [], null
    );
    expect(res.status).toBe('blocked');
  });
});
