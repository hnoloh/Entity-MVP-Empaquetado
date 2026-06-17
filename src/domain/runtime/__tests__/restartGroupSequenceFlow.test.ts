import { restartGroupSequenceFlow } from '../restartGroupSequenceFlow';
import type { GroupSequenceInitializationResult } from '../RuntimeExecutionResult';

describe('restartGroupSequenceFlow', () => {
  it('returns restarted when explicit action and groupId are provided (from completed)', () => {
    const result = restartGroupSequenceFlow({
      explicitUserAction: true,
      groupId: 'g-1',
    });
    expect(result.status).toBe('restarted');
    expect(result.groupId).toBe('g-1');
  });

  it('returns restarted when explicit action and groupId are provided (from initialized/running)', () => {
    const state: GroupSequenceInitializationResult = {
      status: 'initialized',
      groupId: 'g-1',
      sequenceId: 'seq-1',
    };
    const result = restartGroupSequenceFlow({
      explicitUserAction: true,
      groupId: 'g-1',
      targetSequenceState: state,
    });
    expect(result.status).toBe('restarted');
    expect(result.groupId).toBe('g-1');
  });

  it('returns blocked if explicitUserAction is missing', () => {
    const result = restartGroupSequenceFlow({
      explicitUserAction: false,
      groupId: 'g-1',
    });
    expect(result.status).toBe('blocked');
    expect(result.error).toBeDefined();
  });

  it('returns controlled_error if groupId is missing', () => {
    const result = restartGroupSequenceFlow({
      explicitUserAction: true,
      groupId: '',
    });
    expect(result.status).toBe('controlled_error');
    expect(result.error).toBeDefined();
  });

  it('returns controlled_error if target state is incoherent', () => {
    const state: GroupSequenceInitializationResult = {
      status: 'initialized',
      groupId: 'g-2', // Mismatch with request groupId
      sequenceId: 'seq-1',
    };
    const result = restartGroupSequenceFlow({
      explicitUserAction: true,
      groupId: 'g-1',
      targetSequenceState: state,
    });
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Incoherent/);
  });
});
