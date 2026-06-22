import type { EntiToolAuthorization } from './entiToolAuthorization';
import type { EntiToolAuthorizationPersistencePayload, EntiToolAuthorizationSnapshot } from './toolAuthorizationPersistenceTypes';
import type { EntiToolRegistry } from './entiToolRegistry';
import { validateToolAuthorizationForPersistence } from './toolAuthorizationPersistencePolicy';

export interface SerializeToolAuthorizationsResult {
  status: 'success' | 'controlled_error';
  payload?: EntiToolAuthorizationPersistencePayload;
  error?: string;
}

export function serializeEntiToolAuthorizations(
  authorizations: EntiToolAuthorization[],
  registry: EntiToolRegistry
): SerializeToolAuthorizationsResult {
  if (!Array.isArray(authorizations)) {
    return { status: 'controlled_error', error: 'Input must be an array of authorizations' };
  }

  const map = new Map<string, Set<string>>();

  for (const auth of authorizations) {
    if (auth.state !== 'authorized') continue;

    const validation = validateToolAuthorizationForPersistence(auth.entiId, auth.toolId, registry);
    if (!validation.success) {
      // Omit invalid tool authorizations silently to avoid breaking the whole save
      continue;
    }

    if (!map.has(auth.entiId)) {
      map.set(auth.entiId, new Set<string>());
    }
    map.get(auth.entiId)!.add(auth.toolId);
  }

  const data: EntiToolAuthorizationSnapshot[] = [];
  // Sort for determinism
  const sortedEntiIds = Array.from(map.keys()).sort();
  for (const entiId of sortedEntiIds) {
    data.push({
      entiId,
      authorizedToolIds: Array.from(map.get(entiId)!).sort()
    });
  }

  return {
    status: 'success',
    payload: {
      root: 'tool_authorizations',
      version: '1.0',
      data
    }
  };
}
