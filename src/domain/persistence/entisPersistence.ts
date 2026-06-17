import type { Enti } from '../enti/Enti';

export interface EntiPersistencePayload {
  root: 'entis';
  version: string;
  data: Enti[];
}

export interface BuildPersistenceResult {
  status: 'success' | 'blocked' | 'controlled_error';
  payload?: EntiPersistencePayload;
  error?: string;
}

export interface RestorePersistenceResult {
  status: 'success' | 'blocked' | 'controlled_error';
  entis?: Enti[];
  error?: string;
}

export function buildEntisPersistencePayload(entis: Enti[]): BuildPersistenceResult {
  if (!Array.isArray(entis)) {
    return { status: 'controlled_error', error: 'Input must be an array of Entis' };
  }

  // Deep clone to ensure stability and avoid reference mutations
  const data = entis.map(enti => ({
    id: enti.id,
    type: enti.type,
    name: enti.name,
    harness: { ...enti.harness, rules: [...enti.harness.rules] },
    cognitiveConfig: { ...enti.cognitiveConfig },
    status: enti.status
  })) as Enti[];

  return {
    status: 'success',
    payload: {
      root: 'entis',
      version: '1.0',
      data
    }
  };
}

export function restoreEntisFromPersistencePayload(payload: unknown): RestorePersistenceResult {
  if (!payload || typeof payload !== 'object') {
    return { status: 'controlled_error', error: 'Payload must be an object' };
  }

  const p = payload as Record<string, unknown>;

  if (p.root !== 'entis') {
    return { status: 'controlled_error', error: 'Invalid root in payload' };
  }

  if (!Array.isArray(p.data)) {
    return { status: 'controlled_error', error: 'Payload data must be an array' };
  }

  const ids = new Set<string>();
  const restored: Enti[] = [];

  for (const item of p.data) {
    if (!item || typeof item !== 'object') {
      return { status: 'controlled_error', error: 'Enti data must be an object' };
    }

    const e = item as Record<string, unknown>;

    if (typeof e.id !== 'string' || !e.id.trim()) {
      return { status: 'controlled_error', error: 'Enti id is missing or invalid' };
    }

    if (ids.has(e.id)) {
      return { status: 'controlled_error', error: `Duplicate Enti id found: ${e.id}` };
    }
    ids.add(e.id);

    if (e.type !== 'enti') {
      return { status: 'controlled_error', error: `Invalid Enti type for id ${e.id}` };
    }

    // Reject fields not belonging to Enti contract (like chat, history, group, slots, runtime)
    const allowedKeys = ['id', 'type', 'name', 'harness', 'cognitiveConfig', 'status'];
    const extraKeys = Object.keys(e).filter(k => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return { status: 'controlled_error', error: `Forbidden fields found in Enti ${e.id}: ${extraKeys.join(', ')}` };
    }

    if (typeof e.name !== 'string') {
      return { status: 'controlled_error', error: `Enti name must be a string for id ${e.id}` };
    }

    if (!e.harness || typeof e.harness !== 'object') {
      return { status: 'controlled_error', error: `Enti harness is missing or invalid for id ${e.id}` };
    }

    if (!e.cognitiveConfig || typeof e.cognitiveConfig !== 'object') {
      return { status: 'controlled_error', error: `Enti cognitiveConfig is missing or invalid for id ${e.id}` };
    }

    if (e.status !== 'complete' && e.status !== 'incomplete') {
      return { status: 'controlled_error', error: `Invalid Enti status for id ${e.id}` };
    }

    const harness = e.harness as Record<string, unknown>;
    if (typeof harness.function !== 'string' || !Array.isArray(harness.rules) || typeof harness.workMaterial !== 'string' || typeof harness.knowledge !== 'string') {
      return { status: 'controlled_error', error: `Invalid harness structure for Enti id ${e.id}` };
    }

    restored.push(e as unknown as Enti);
  }

  return { status: 'success', entis: restored };
}
