import { describe, it, expect } from 'vitest';
import {
  persistSequencesFlow,
  restoreSequencesFlow,
  type SequencePersistencePayload,
  type PersistSequencesRequest,
  type RestoreSequencesRequest,
  type SequenceState
} from '../sequencesPersistence';

describe('Sequences Functional Persistence', () => {
  const validSeq: SequenceState = {
    groupId: 'group-1',
    sequenceId: 'seq-1',
    currentSlotId: 'slot-1',
    pendingSlotIds: ['slot-1', 'slot-2'],
    completedSlotIds: [],
    status: 'initialized'
  };

  it('blocks execution without explicit user action', () => {
    const request: PersistSequencesRequest = { explicitUserAction: false, sequences: [validSeq] };
    const result = persistSequencesFlow(request);
    expect(result.status).toBe('blocked');
    expect(result.error).toMatch(/Missing explicit user action/);
  });

  it('persists sequences successfully', () => {
    const request: PersistSequencesRequest = { explicitUserAction: true, sequences: [validSeq] };
    const result = persistSequencesFlow(request);
    
    expect(result.status).toBe('success');
    expect(result.payload?.root).toBe('sequences');
    expect(result.payload?.data.length).toBe(1);
    expect(result.payload?.data[0].sequenceId).toBe('seq-1');
  });

  it('restores sequences successfully from valid payload', () => {
    const payload: SequencePersistencePayload = {
      root: 'sequences',
      version: '1.0',
      data: [validSeq]
    };

    const request: RestoreSequencesRequest = { explicitUserAction: true, payload };
    const result = restoreSequencesFlow(request);

    expect(result.status).toBe('success');
    expect(result.sequences?.length).toBe(1);
    expect(result.sequences?.[0].sequenceId).toBe('seq-1');
    expect(result.sequences?.[0].currentSlotId).toBe('slot-1');
  });

  it('returns controlled_error on duplicate sequenceId', () => {
    const request: PersistSequencesRequest = { explicitUserAction: true, sequences: [validSeq, validSeq] };
    const result = persistSequencesFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Duplicate sequence id/);
  });

  it('returns controlled_error when payload root is invalid', () => {
    const request: RestoreSequencesRequest = { explicitUserAction: true, payload: { root: 'invalid', data: [] } };
    const result = restoreSequencesFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Invalid root/);
  });

  it('returns controlled_error when currentSlotId is not in pending or completed slots', () => {
    const invalidSeq: SequenceState = {
      ...validSeq,
      currentSlotId: 'unknown-slot',
      pendingSlotIds: ['slot-1'],
      completedSlotIds: []
    };
    const request: PersistSequencesRequest = { explicitUserAction: true, sequences: [invalidSeq] };
    const result = persistSequencesFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/currentSlotId unknown-slot is not in pending or completed/);
  });

  it('returns controlled_error when payload contains secret or visualState', () => {
    const payload: SequencePersistencePayload = {
      root: 'sequences',
      version: '1.0',
      data: [{ ...validSeq, apiKey: 'secret' } as any] // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    const request: RestoreSequencesRequest = { explicitUserAction: true, payload };
    const result = restoreSequencesFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Forbidden state or secret/);
  });

  it('returns controlled_error when payload contains providerState or promptEngineState', () => {
    const payload: SequencePersistencePayload = {
      root: 'sequences',
      version: '1.0',
      data: [{ ...validSeq, providerState: { active: true } } as any] // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    const request: RestoreSequencesRequest = { explicitUserAction: true, payload };
    const result = restoreSequencesFlow(request);
    expect(result.status).toBe('controlled_error');
    expect(result.error).toMatch(/Forbidden state or secret/);
  });
});
