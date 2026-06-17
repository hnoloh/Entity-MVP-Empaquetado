import type { Enti, EntiCognitiveConfig } from '../enti/Enti';

export interface CognitiveConfigEntry {
  entiId: string;
  config: Omit<EntiCognitiveConfig, 'apiKey'>;
}

export interface CognitivePersistencePayload {
  root: 'cognitive';
  version: string;
  data: CognitiveConfigEntry[];
}

export interface CognitivePersistenceRequest {
  explicitUserAction: boolean;
  entis: Enti[];
}

export interface CognitiveRestoreRequest {
  explicitUserAction: boolean;
  payload: unknown;
  entisToValidateAgainst?: Enti[];
}

export interface CognitivePersistenceResult {
  status: 'success' | 'blocked' | 'controlled_error';
  payload?: CognitivePersistencePayload;
  error?: string;
}

export interface CognitiveRestoreResult {
  status: 'success' | 'blocked' | 'controlled_error';
  configs?: CognitiveConfigEntry[];
  error?: string;
}

export function persistCognitiveConfigFlow(request: CognitivePersistenceRequest): CognitivePersistenceResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Missing explicit user action' };
  }

  if (!Array.isArray(request.entis)) {
    return { status: 'controlled_error', error: 'Input must be an array of Entis' };
  }

  const data: CognitiveConfigEntry[] = [];
  const ids = new Set<string>();

  for (const enti of request.entis) {
    if (!enti.id) {
      return { status: 'controlled_error', error: 'Enti is missing id' };
    }
    if (ids.has(enti.id)) {
      return { status: 'controlled_error', error: `Duplicate Enti id found: ${enti.id}` };
    }
    ids.add(enti.id);

    // Filter out API key
    const configToSave = { ...(enti.cognitiveConfig || { mode: 'unconfigured' as const }) } as Record<string, unknown>;
    delete configToSave.apiKey;

    data.push({
      entiId: enti.id,
      config: configToSave as unknown as Omit<EntiCognitiveConfig, 'apiKey'>
    });
  }

  return {
    status: 'success',
    payload: {
      root: 'cognitive',
      version: '1.0',
      data
    }
  };
}

export function restoreCognitiveConfigFlow(request: CognitiveRestoreRequest): CognitiveRestoreResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Missing explicit user action' };
  }

  const { payload, entisToValidateAgainst } = request;

  if (!payload || typeof payload !== 'object') {
    return { status: 'controlled_error', error: 'Payload must be an object' };
  }

  const p = payload as Record<string, unknown>;

  if (p.root !== 'cognitive') {
    return { status: 'controlled_error', error: 'Invalid root in payload' };
  }

  if (!Array.isArray(p.data)) {
    return { status: 'controlled_error', error: 'Payload data must be an array' };
  }

  const ids = new Set<string>();
  const restored: CognitiveConfigEntry[] = [];
  const validEntiIds = entisToValidateAgainst ? new Set(entisToValidateAgainst.map(e => e.id)) : null;

  for (const item of p.data) {
    if (!item || typeof item !== 'object') {
      return { status: 'controlled_error', error: 'Cognitive config entry must be an object' };
    }

    const entry = item as Record<string, unknown>;

    if (typeof entry.entiId !== 'string' || !entry.entiId.trim()) {
      return { status: 'controlled_error', error: 'Entry entiId is missing or invalid' };
    }

    if (ids.has(entry.entiId)) {
      return { status: 'controlled_error', error: `Duplicate entiId found in payload: ${entry.entiId}` };
    }
    ids.add(entry.entiId);

    if (validEntiIds && !validEntiIds.has(entry.entiId)) {
      return { status: 'controlled_error', error: `Cognitive config refers to unknown Enti id: ${entry.entiId}` };
    }

    if (!entry.config || typeof entry.config !== 'object') {
      return { status: 'controlled_error', error: `Missing or invalid config object for entiId: ${entry.entiId}` };
    }

    const config = entry.config as Record<string, unknown>;

    // Reject API keys or secrets
    if ('apiKey' in config || 'secret' in config || 'token' in config) {
      return { status: 'controlled_error', error: `Forbidden secret found in cognitive config for entiId: ${entry.entiId}` };
    }

    if (typeof config.mode !== 'string') {
      return { status: 'controlled_error', error: `Invalid mode in cognitive config for entiId: ${entry.entiId}` };
    }

    restored.push({
      entiId: entry.entiId,
      config: {
        mode: config.mode as EntiCognitiveConfig['mode'],
        provider: typeof config.provider === 'string' ? config.provider : undefined,
        model: typeof config.model === 'string' ? config.model : undefined
      }
    });
  }

  return { status: 'success', configs: restored };
}
