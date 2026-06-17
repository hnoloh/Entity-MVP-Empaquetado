import { isValidGroupSlotId, type GroupSlotId } from '../group/Group';

export interface GroupMemberPositionState {
  groupId: string;
  slots: Partial<Record<GroupSlotId, string>>;
}

export interface GroupMemberPositionsPersistencePayload {
  root: 'member_positions';
  version: string;
  data: GroupMemberPositionState[];
}

export interface GroupMemberPositionsPersistenceRequest {
  explicitUserAction: boolean;
  positions: GroupMemberPositionState[];
}

export interface GroupMemberPositionsRestoreRequest {
  explicitUserAction: boolean;
  payload: unknown;
}

export interface GroupMemberPositionsPersistenceResult {
  status: 'success' | 'blocked' | 'controlled_error';
  payload?: GroupMemberPositionsPersistencePayload;
  positions?: GroupMemberPositionState[];
  error?: string;
}

const FORBIDDEN_KEYS = [
  'apiKey', 'secret', 'token',
  'providerState', 'runtimeState', 'promptEngineState',
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

export function persistGroupMemberPositionsFlow(request: GroupMemberPositionsPersistenceRequest): GroupMemberPositionsPersistenceResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Missing explicit user action' };
  }

  if (!Array.isArray(request.positions)) {
    return { status: 'controlled_error', error: 'Input must be an array of positions' };
  }

  const safeData: GroupMemberPositionState[] = [];
  const ids = new Set<string>();

  for (const pos of request.positions) {
    if (!pos.groupId || typeof pos.groupId !== 'string') {
      return { status: 'controlled_error', error: 'Position state is missing groupId' };
    }

    if (ids.has(pos.groupId)) {
      return { status: 'controlled_error', error: `Duplicate groupId found: ${pos.groupId}` };
    }
    ids.add(pos.groupId);

    if (hasForbiddenKeys(pos)) {
      return { status: 'controlled_error', error: `Forbidden state or secret found in positions of groupId: ${pos.groupId}` };
    }

    const safeSlots: Partial<Record<GroupSlotId, string>> = {};
    const entiIdsInSlots = new Set<string>();

    if (pos.slots) {
      for (const [slotId, entiId] of Object.entries(pos.slots)) {
        if (!isValidGroupSlotId(slotId)) {
          return { status: 'controlled_error', error: `Invalid slot id ${slotId} in Group ${pos.groupId}` };
        }
        if (entiId !== undefined && entiId !== null && entiId !== '') {
          if (typeof entiId !== 'string') {
            return { status: 'controlled_error', error: `Slot ${slotId} contains invalid entiId type in Group ${pos.groupId}` };
          }
          if (entiIdsInSlots.has(entiId)) {
            return { status: 'controlled_error', error: `Duplicate entiId ${entiId} found in slots for Group ${pos.groupId}` };
          }
          entiIdsInSlots.add(entiId);
          safeSlots[slotId as GroupSlotId] = entiId;
        }
      }
    }

    safeData.push({
      groupId: pos.groupId,
      slots: safeSlots
    });
  }

  return {
    status: 'success',
    payload: {
      root: 'member_positions',
      version: '1.0',
      data: safeData
    }
  };
}

export function restoreGroupMemberPositionsFlow(request: GroupMemberPositionsRestoreRequest): GroupMemberPositionsPersistenceResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Missing explicit user action' };
  }

  const payload = request.payload as Record<string, unknown>;

  if (!payload || typeof payload !== 'object') {
    return { status: 'controlled_error', error: 'Payload must be an object' };
  }

  if (payload.root !== 'member_positions') {
    return { status: 'controlled_error', error: 'Invalid root in payload' };
  }

  if (!Array.isArray(payload.data)) {
    return { status: 'controlled_error', error: 'Payload data must be an array' };
  }

  const restored: GroupMemberPositionState[] = [];
  const ids = new Set<string>();

  for (const item of payload.data) {
    if (!item || typeof item !== 'object') {
      return { status: 'controlled_error', error: 'Position entry must be an object' };
    }

    const pos = item as Record<string, unknown>;

    if (!pos.groupId || typeof pos.groupId !== 'string') {
      return { status: 'controlled_error', error: 'Position entry missing or invalid groupId' };
    }

    if (ids.has(pos.groupId)) {
      return { status: 'controlled_error', error: `Duplicate groupId found in payload: ${pos.groupId}` };
    }
    ids.add(pos.groupId);

    if (hasForbiddenKeys(pos)) {
      return { status: 'controlled_error', error: `Forbidden state or secret found in positions of groupId: ${pos.groupId}` };
    }

    const safeSlots: Partial<Record<GroupSlotId, string>> = {};
    const entiIdsInSlots = new Set<string>();

    if (pos.slots && typeof pos.slots === 'object') {
      const slotsRecord = pos.slots as Record<string, unknown>;
      for (const [slotId, entiId] of Object.entries(slotsRecord)) {
        if (!isValidGroupSlotId(slotId)) {
          return { status: 'controlled_error', error: `Invalid slot id ${slotId} in Group ${pos.groupId}` };
        }
        if (entiId !== undefined && entiId !== null && entiId !== '') {
          if (typeof entiId !== 'string') {
            return { status: 'controlled_error', error: `Slot ${slotId} contains invalid entiId type in Group ${pos.groupId}` };
          }
          if (entiIdsInSlots.has(entiId as string)) {
            return { status: 'controlled_error', error: `Duplicate entiId ${entiId} found in slots for Group ${pos.groupId}` };
          }
          entiIdsInSlots.add(entiId as string);
          safeSlots[slotId as GroupSlotId] = entiId as string;
        }
      }
    } else if (pos.slots !== undefined) {
       return { status: 'controlled_error', error: `Slots must be an object in Group ${pos.groupId}` };
    }

    restored.push({
      groupId: pos.groupId,
      slots: safeSlots
    });
  }

  return { status: 'success', positions: restored };
}
