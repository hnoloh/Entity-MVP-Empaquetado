export interface SequenceState {
  groupId: string;
  chatId?: string;
  sequenceId?: string;
  currentSlotId?: string;
  pendingSlotIds?: string[];
  completedSlotIds?: string[];
  status?: string;
}

export interface SequencePersistencePayload {
  root: 'sequences';
  version: string;
  data: SequenceState[];
}

export interface PersistSequencesRequest {
  explicitUserAction: boolean;
  sequences: SequenceState[];
}

export interface RestoreSequencesRequest {
  explicitUserAction: boolean;
  payload: unknown;
}

export interface SequencesPersistenceResult {
  status: 'success' | 'blocked' | 'controlled_error';
  payload?: SequencePersistencePayload;
  sequences?: SequenceState[];
  error?: string;
}

const FORBIDDEN_KEYS = [
  'apiKey', 'secret', 'token',
  'providerState', 'runtimeExecutionState', 'promptEngineState',
  'visualState', 'layout', 'window', 'foco', 'focus', 'uiState'
];

function hasForbiddenKeys(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_KEYS.includes(key)) {
      return true;
    }
    if (typeof record[key] === 'object' && record[key] !== null) {
      if (hasForbiddenKeys(record[key])) {
        return true;
      }
    }
  }
  return false;
}

export function persistSequencesFlow(request: PersistSequencesRequest): SequencesPersistenceResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Missing explicit user action' };
  }

  if (!Array.isArray(request.sequences)) {
    return { status: 'controlled_error', error: 'Input must be an array of sequences' };
  }

  const safeData: SequenceState[] = [];
  const ids = new Set<string>();

  for (const seq of request.sequences) {
    if (!seq.groupId) {
      return { status: 'controlled_error', error: 'Sequence is missing groupId' };
    }
    
    // We can use sequenceId or groupId as the unique identifier for the payload check
    const id = seq.sequenceId || seq.groupId;
    if (ids.has(id)) {
      return { status: 'controlled_error', error: `Duplicate sequence id found: ${id}` };
    }
    ids.add(id);

    if (hasForbiddenKeys(seq)) {
      return { status: 'controlled_error', error: `Forbidden state or secret found in sequence: ${id}` };
    }

    // Check currentSlotId coherence
    if (seq.currentSlotId) {
      const allowedSlots = [...(seq.pendingSlotIds || []), ...(seq.completedSlotIds || [])];
      if (allowedSlots.length > 0 && !allowedSlots.includes(seq.currentSlotId)) {
        return { status: 'controlled_error', error: `currentSlotId ${seq.currentSlotId} is not in pending or completed slots for sequence: ${id}` };
      }
    }

    safeData.push({
      groupId: seq.groupId,
      chatId: seq.chatId,
      sequenceId: seq.sequenceId,
      currentSlotId: seq.currentSlotId,
      pendingSlotIds: seq.pendingSlotIds ? [...seq.pendingSlotIds] : [],
      completedSlotIds: seq.completedSlotIds ? [...seq.completedSlotIds] : [],
      status: seq.status
    });
  }

  return {
    status: 'success',
    payload: {
      root: 'sequences',
      version: '1.0',
      data: safeData
    }
  };
}

export function restoreSequencesFlow(request: RestoreSequencesRequest): SequencesPersistenceResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Missing explicit user action' };
  }

  const payload = request.payload as Record<string, unknown>;

  if (!payload || typeof payload !== 'object') {
    return { status: 'controlled_error', error: 'Payload must be an object' };
  }

  if (payload.root !== 'sequences') {
    return { status: 'controlled_error', error: 'Invalid root in payload' };
  }

  if (!Array.isArray(payload.data)) {
    return { status: 'controlled_error', error: 'Payload data must be an array' };
  }

  const restored: SequenceState[] = [];
  const ids = new Set<string>();

  for (const item of payload.data) {
    if (!item || typeof item !== 'object') {
      return { status: 'controlled_error', error: 'Sequence entry must be an object' };
    }

    const seq = item as Record<string, unknown>;

    if (!seq.groupId || typeof seq.groupId !== 'string') {
      return { status: 'controlled_error', error: 'Sequence entry missing or invalid groupId' };
    }

    const id = (seq.sequenceId || seq.groupId) as string;
    if (ids.has(id)) {
      return { status: 'controlled_error', error: `Duplicate sequence id found in payload: ${id}` };
    }
    ids.add(id);

    if (hasForbiddenKeys(seq)) {
      return { status: 'controlled_error', error: `Forbidden state or secret found in sequence: ${id}` };
    }

    // Check currentSlotId coherence
    if (seq.currentSlotId) {
      const allowedSlots = [...((seq.pendingSlotIds as string[]) || []), ...((seq.completedSlotIds as string[]) || [])];
      if (allowedSlots.length > 0 && !allowedSlots.includes(seq.currentSlotId as string)) {
        return { status: 'controlled_error', error: `currentSlotId ${seq.currentSlotId as string} is not in pending or completed slots for sequence: ${id}` };
      }
    }

    restored.push({
      groupId: seq.groupId as string,
      chatId: seq.chatId as string | undefined,
      sequenceId: seq.sequenceId as string | undefined,
      currentSlotId: seq.currentSlotId as string | undefined,
      pendingSlotIds: seq.pendingSlotIds ? [...(seq.pendingSlotIds as string[])] : [],
      completedSlotIds: seq.completedSlotIds ? [...(seq.completedSlotIds as string[])] : [],
      status: seq.status as string | undefined
    });
  }

  return { status: 'success', sequences: restored };
}
