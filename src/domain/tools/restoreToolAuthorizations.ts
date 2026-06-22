import type { EntiToolAuthorization } from './entiToolAuthorization';

import type { EntiToolRegistry } from './entiToolRegistry';
import { validateToolAuthorizationForPersistence } from './toolAuthorizationPersistencePolicy';

export interface RestoreToolAuthorizationsResult {
  status: 'success' | 'controlled_error';
  authorizations?: EntiToolAuthorization[];
  error?: string;
}

export function restoreEntiToolAuthorizations(
  payload: unknown,
  registry: EntiToolRegistry
): RestoreToolAuthorizationsResult {
  if (!payload || typeof payload !== 'object') {
    return { status: 'controlled_error', error: 'Payload must be an object' };
  }

  const p = payload as Record<string, unknown>;

  if (p.root !== 'tool_authorizations') {
    return { status: 'controlled_error', error: 'Invalid root in tool authorizations payload' };
  }

  if (!Array.isArray(p.data)) {
    return { status: 'controlled_error', error: 'Payload data must be an array' };
  }

  const restored: EntiToolAuthorization[] = [];

  for (const item of p.data) {
    if (!item || typeof item !== 'object') {
      return { status: 'controlled_error', error: 'Snapshot item must be an object' };
    }

    const snap = item as Record<string, unknown>;

    if (typeof snap.entiId !== 'string' || !snap.entiId.trim()) {
      return { status: 'controlled_error', error: 'entiId is missing or invalid in snapshot' };
    }

    if (!Array.isArray(snap.authorizedToolIds)) {
      return { status: 'controlled_error', error: `authorizedToolIds must be an array for entiId ${snap.entiId}` };
    }

    for (const toolId of snap.authorizedToolIds) {
      if (typeof toolId !== 'string') continue;

      const validation = validateToolAuthorizationForPersistence(snap.entiId, toolId, registry);
      if (validation.success) {
        restored.push({
          entiId: snap.entiId,
          toolId,
          state: 'authorized'
        });
      }
      // If validation fails, we just skip it (discard blocked/unknown tools)
    }
  }

  return { status: 'success', authorizations: restored };
}
