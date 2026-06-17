import type { Group, GroupSlotId } from '../group/Group';
import { isValidGroupSlotId } from '../group/Group';

export interface GroupPersistencePayload {
  root: 'groups';
  version: string;
  data: Group[];
}

export interface BuildGroupsPersistenceResult {
  status: 'success' | 'blocked' | 'controlled_error';
  payload?: GroupPersistencePayload;
  error?: string;
}

export interface RestoreGroupsPersistenceResult {
  status: 'success' | 'blocked' | 'controlled_error';
  groups?: Group[];
  error?: string;
}

export function buildGroupsPersistencePayload(groups: Group[]): BuildGroupsPersistenceResult {
  if (!Array.isArray(groups)) {
    return { status: 'controlled_error', error: 'Input must be an array of Groups' };
  }

  // Deep clone to ensure stability
  const data = groups.map(group => ({
    id: group.id,
    type: group.type,
    name: group.name,
    function: group.function,
    slots: group.slots ? { ...group.slots } : undefined
  })) as Group[];

  return {
    status: 'success',
    payload: {
      root: 'groups',
      version: '1.0',
      data
    }
  };
}

export function restoreGroupsFromPersistencePayload(payload: unknown): RestoreGroupsPersistenceResult {
  if (!payload || typeof payload !== 'object') {
    return { status: 'controlled_error', error: 'Payload must be an object' };
  }

  const p = payload as Record<string, unknown>;

  if (p.root !== 'groups') {
    return { status: 'controlled_error', error: 'Invalid root in payload' };
  }

  if (!Array.isArray(p.data)) {
    return { status: 'controlled_error', error: 'Payload data must be an array' };
  }

  const ids = new Set<string>();
  const restored: Group[] = [];

  for (const item of p.data) {
    if (!item || typeof item !== 'object') {
      return { status: 'controlled_error', error: 'Group data must be an object' };
    }

    const g = item as Record<string, unknown>;

    if (typeof g.id !== 'string' || !g.id.trim()) {
      return { status: 'controlled_error', error: 'Group id is missing or invalid' };
    }

    if (ids.has(g.id)) {
      return { status: 'controlled_error', error: `Duplicate Group id found: ${g.id}` };
    }
    ids.add(g.id);

    if (g.type !== 'group' && g.type !== 'grupo') {
      return { status: 'controlled_error', error: `Invalid Group type for id ${g.id}` };
    }

    if (typeof g.name !== 'string') {
      return { status: 'controlled_error', error: `Group name must be a string for id ${g.id}` };
    }

    const allowedKeys = ['id', 'type', 'name', 'function', 'slots'];
    const extraKeys = Object.keys(g).filter(k => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return { status: 'controlled_error', error: `Forbidden fields found in Group ${g.id}: ${extraKeys.join(', ')}` };
    }

    if (g.function !== undefined && typeof g.function !== 'string') {
      return { status: 'controlled_error', error: `Group function must be a string for id ${g.id}` };
    }

    let parsedSlots: Partial<Record<GroupSlotId, string>> | undefined = undefined;
    
    if (g.slots !== undefined) {
      if (typeof g.slots !== 'object' || g.slots === null) {
        return { status: 'controlled_error', error: `Group slots must be an object for id ${g.id}` };
      }
      
      parsedSlots = {};
      const s = g.slots as Record<string, unknown>;
      const entiIdsInSlots = new Set<string>();

      for (const key of Object.keys(s)) {
        if (!isValidGroupSlotId(key)) {
          return { status: 'controlled_error', error: `Invalid slot id ${key} in Group ${g.id}` };
        }
        
        const entiId = s[key];
        if (entiId !== undefined && entiId !== null && entiId !== '') {
          if (typeof entiId !== 'string') {
            return { status: 'controlled_error', error: `Slot ${key} contains invalid entiId type in Group ${g.id}` };
          }
          if (entiIdsInSlots.has(entiId)) {
            return { status: 'controlled_error', error: `Duplicate entiId ${entiId} found in slots for Group ${g.id}` };
          }
          entiIdsInSlots.add(entiId);
          parsedSlots[key as GroupSlotId] = entiId;
        }
      }
    }

    restored.push({
      id: g.id,
      type: g.type as 'group',
      name: g.name,
      function: g.function as string | undefined,
      slots: parsedSlots
    });
  }

  return { status: 'success', groups: restored };
}
