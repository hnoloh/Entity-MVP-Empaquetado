import type { SequenceState } from '../sequencesPersistence';
import type { OperationalRestorePayload } from '../operationalRestore';
import type { SequencePersistencePayload } from '../sequencesPersistence';

export function applyRuntimeStateRestoreGuard(basePayload: OperationalRestorePayload): OperationalRestorePayload {
  if (!basePayload || !basePayload.data) return basePayload;

  const seqPayload = basePayload.data.sequencePayload as SequencePersistencePayload | undefined;
  if (!seqPayload || !seqPayload.data) return basePayload;

  const safeSequences: SequenceState[] = seqPayload.data.map((seq: SequenceState) => {
    if (seq.status === 'running') {
      return { ...seq, status: 'idle' }; // Anti auto-run guard
    }
    return seq;
  });

  return {
    ...basePayload,
    data: {
      ...basePayload.data,
      sequencePayload: {
        ...seqPayload,
        data: safeSequences
      }
    }
  };
}
