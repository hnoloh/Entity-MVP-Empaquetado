import { storage } from '../../infrastructure/storage/indexedDbStorage';
import { restoreOperationalStateFlow } from '../persistence/operationalRestore';
import { entiRepository } from '../enti/entiRepository';
import { chatRepository } from '../chat/chatRepository';
import { toolAuthorizationRepository } from '../tools/toolAuthorizationRepository';
import type { Enti } from '../enti/Enti';
import type { Group } from '../group/Group';

export interface LoadPersistedOperationalStateRequest {
  lifecyclePhaseAuthorized: boolean;
  snapshotId?: string;
}

export interface LoadPersistedOperationalStateResult {
  status: 'success' | 'success_empty' | 'blocked' | 'controlled_error';
  error?: string;
  restoredEntis?: Enti[];
  restoredGroups?: Group[];
}

export async function loadPersistedOperationalStateFlow(request: LoadPersistedOperationalStateRequest): Promise<LoadPersistedOperationalStateResult> {
  if (!request.lifecyclePhaseAuthorized) {
    return { status: 'blocked', error: 'Lifecycle phase not authorized' };
  }

  const snapshotId = request.snapshotId || 'main-workspace';

  try {
    const payload = await storage.loadSnapshot(snapshotId);
    
    if (!payload) {
      return { status: 'success_empty' };
    }

    const restoreResult = restoreOperationalStateFlow({ explicitUserAction: true, payload });

    if (restoreResult.status !== 'success' || !restoreResult.restoredState) {
      return { status: 'controlled_error', error: restoreResult.error || 'Validation failed during restore' };
    }

    const { entis, groups, chats, positions, toolAuthorizations } = restoreResult.restoredState;

    // All-or-nothing execution
    entiRepository.clear();
    chatRepository.clear();
    toolAuthorizationRepository.clear();

    if (toolAuthorizations && toolAuthorizations.length > 0) {
      toolAuthorizationRepository.save(toolAuthorizations);
    }

    const finalEntis = entis || [];
    finalEntis.forEach(e => entiRepository.save(e));

    const finalChats = chats || [];
    finalChats.forEach(c => chatRepository.save(c));

    const finalGroups = (groups || []).map(g => {
        const pos = positions?.find(p => p.groupId === g.id);
        return {
          ...g,
          slots: pos ? pos.slots : g.slots
        };
    });

    return {
      status: 'success',
      restoredEntis: finalEntis,
      restoredGroups: finalGroups
    };
  } catch (error) {
    return { status: 'controlled_error', error: error instanceof Error ? error.message : 'Unknown error during storage access' };
  }
}
