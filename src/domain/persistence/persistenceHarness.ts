import type { Enti } from '../enti/Enti';
import type { Group } from '../group/Group';
import {
  buildEntisPersistencePayload,
  restoreEntisFromPersistencePayload,
  type EntiPersistencePayload
} from './entisPersistence';
import {
  buildGroupsPersistencePayload,
  restoreGroupsFromPersistencePayload,
  type GroupPersistencePayload
} from './groupsPersistence';
import {
  persistCognitiveConfigFlow,
  restoreCognitiveConfigFlow,
  type CognitivePersistencePayload,
  type CognitiveConfigEntry
} from './cognitivePersistence';
import {
  persistChatHistoriesFlow,
  restoreChatHistoriesFlow,
  type ChatHistoriesPersistencePayload
} from './chatHistoriesPersistence';
import {
  persistSequencesFlow,
  restoreSequencesFlow,
  type SequencePersistencePayload,
  type SequenceState
} from './sequencesPersistence';
import {
  persistGroupMemberPositionsFlow,
  restoreGroupMemberPositionsFlow,
  type GroupMemberPositionsPersistencePayload,
  type GroupMemberPositionState
} from './groupMemberPositionsPersistence';
import type { Chat } from '../chat/Chat';

export type PersistenceMode = 'entis' | 'groups' | 'combined' | 'cognitive' | 'full';

export interface PersistenceHarnessRequest {
  explicitUserAction: boolean;
  action: 'persist' | 'restore';
  mode: PersistenceMode;
  
  // For persist action
  entis?: Enti[];
  groups?: Group[];
  chats?: Chat[];
  sequences?: SequenceState[];
  positions?: GroupMemberPositionState[];

  // For restore action
  entiPayload?: unknown;
  groupPayload?: unknown;
  cognitivePayload?: unknown;
  chatPayload?: unknown;
  sequencePayload?: unknown;
  positionPayload?: unknown;

  // Options
  enforceCrossReferenceConsistency?: boolean;
}

export interface PersistenceHarnessResult {
  status: 'success' | 'blocked' | 'controlled_error';
  error?: string;
  entiPayload?: EntiPersistencePayload;
  groupPayload?: GroupPersistencePayload;
  cognitivePayload?: CognitivePersistencePayload;
  chatPayload?: ChatHistoriesPersistencePayload;
  sequencePayload?: SequencePersistencePayload;
  positionPayload?: GroupMemberPositionsPersistencePayload;
  entis?: Enti[];
  groups?: Group[];
  cognitiveConfigs?: CognitiveConfigEntry[]; // To simplify return type signature
  chats?: Chat[];
  sequences?: SequenceState[];
  positions?: GroupMemberPositionState[];
}

export function runPersistenceHarnessFlow(request: PersistenceHarnessRequest): PersistenceHarnessResult {
  if (!request.explicitUserAction) {
    return { status: 'blocked', error: 'Missing explicit user action' };
  }

  if (request.action === 'persist') {
    return handlePersist(request);
  } else if (request.action === 'restore') {
    return handleRestore(request);
  }

  return { status: 'blocked', error: 'Invalid action specified' };
}

function handlePersist(request: PersistenceHarnessRequest): PersistenceHarnessResult {
  const result: PersistenceHarnessResult = { status: 'success' };

  if (request.mode === 'entis' || request.mode === 'combined' || request.mode === 'full') {
    if (!request.entis) {
      return { status: 'controlled_error', error: 'Missing entis array for persistence' };
    }
    const entiRes = buildEntisPersistencePayload(request.entis);
    if (entiRes.status !== 'success') {
      return { status: entiRes.status, error: entiRes.error };
    }
    result.entiPayload = entiRes.payload;
  }

  if (request.mode === 'groups' || request.mode === 'combined' || request.mode === 'full') {
    if (!request.groups) {
      return { status: 'controlled_error', error: 'Missing groups array for persistence' };
    }
    const groupRes = buildGroupsPersistencePayload(request.groups);
    if (groupRes.status !== 'success') {
      return { status: groupRes.status, error: groupRes.error };
    }
    result.groupPayload = groupRes.payload;
  }

  if (request.mode === 'cognitive' || request.mode === 'full') {
    if (!request.entis) {
      return { status: 'controlled_error', error: 'Missing entis array for cognitive persistence' };
    }
    const cogRes = persistCognitiveConfigFlow({ explicitUserAction: true, entis: request.entis });
    if (cogRes.status !== 'success') {
      return { status: cogRes.status, error: cogRes.error };
    }
    result.cognitivePayload = cogRes.payload;
  }

  if (request.mode === 'full') {
    if (!request.chats) {
      return { status: 'controlled_error', error: 'Missing chats array for full persistence' };
    }
    const chatRes = persistChatHistoriesFlow({ explicitUserAction: true, chats: request.chats });
    if (chatRes.status !== 'success') {
      return { status: chatRes.status, error: chatRes.error };
    }
    result.chatPayload = chatRes.payload;

    if (!request.sequences) {
      return { status: 'controlled_error', error: 'Missing sequences array for full persistence' };
    }
    const seqRes = persistSequencesFlow({ explicitUserAction: true, sequences: request.sequences });
    if (seqRes.status !== 'success') {
      return { status: seqRes.status, error: seqRes.error };
    }
    result.sequencePayload = seqRes.payload;

    if (!request.positions) {
      return { status: 'controlled_error', error: 'Missing positions array for full persistence' };
    }
    const posRes = persistGroupMemberPositionsFlow({ explicitUserAction: true, positions: request.positions });
    if (posRes.status !== 'success') {
      return { status: posRes.status, error: posRes.error };
    }
    result.positionPayload = posRes.payload;
  }

  // Cross reference validation (if required in combined/full mode)
  if ((request.mode === 'combined' || request.mode === 'full') && request.enforceCrossReferenceConsistency && request.groups && request.entis) {
    const validEntiIds = new Set(request.entis.map(e => e.id));
    for (const g of request.groups) {
      if (g.slots) {
        for (const [slotId, entiId] of Object.entries(g.slots)) {
          if (entiId && !validEntiIds.has(entiId)) {
            return { 
              status: 'controlled_error', 
              error: `Cross reference inconsistency: Group ${g.id} slot ${slotId} refers to unknown Enti ${entiId}`
            };
          }
        }
      }
    }
  }

  return result;
}

function handleRestore(request: PersistenceHarnessRequest): PersistenceHarnessResult {
  const result: PersistenceHarnessResult = { status: 'success' };

  if (request.mode === 'entis' || request.mode === 'combined' || request.mode === 'full') {
    if (!request.entiPayload) {
      return { status: 'controlled_error', error: 'Missing entiPayload for restore' };
    }
    const entiRes = restoreEntisFromPersistencePayload(request.entiPayload);
    if (entiRes.status !== 'success') {
      return { status: entiRes.status, error: entiRes.error };
    }
    result.entis = entiRes.entis;
  }

  if (request.mode === 'groups' || request.mode === 'combined' || request.mode === 'full') {
    if (!request.groupPayload) {
      return { status: 'controlled_error', error: 'Missing groupPayload for restore' };
    }
    const groupRes = restoreGroupsFromPersistencePayload(request.groupPayload);
    if (groupRes.status !== 'success') {
      return { status: groupRes.status, error: groupRes.error };
    }
    result.groups = groupRes.groups;
  }

  if (request.mode === 'cognitive' || request.mode === 'full') {
    if (!request.cognitivePayload) {
      return { status: 'controlled_error', error: 'Missing cognitivePayload for restore' };
    }
    // If full mode, we can validate against the restored entis
    const cogRes = restoreCognitiveConfigFlow({ 
      explicitUserAction: true, 
      payload: request.cognitivePayload,
      entisToValidateAgainst: request.mode === 'full' ? result.entis : undefined
    });
    if (cogRes.status !== 'success') {
      return { status: cogRes.status, error: cogRes.error };
    }
    result.cognitiveConfigs = cogRes.configs;
  }

  if (request.mode === 'full') {
    if (!request.chatPayload) {
      return { status: 'controlled_error', error: 'Missing chatPayload for restore' };
    }
    const chatRes = restoreChatHistoriesFlow({ explicitUserAction: true, payload: request.chatPayload });
    if (chatRes.status !== 'success') {
      return { status: chatRes.status, error: chatRes.error };
    }
    result.chats = chatRes.chats;

    if (!request.sequencePayload) {
      return { status: 'controlled_error', error: 'Missing sequencePayload for restore' };
    }
    const seqRes = restoreSequencesFlow({ explicitUserAction: true, payload: request.sequencePayload });
    if (seqRes.status !== 'success') {
      return { status: seqRes.status, error: seqRes.error };
    }
    result.sequences = seqRes.sequences;

    if (!request.positionPayload) {
      return { status: 'controlled_error', error: 'Missing positionPayload for restore' };
    }
    const posRes = restoreGroupMemberPositionsFlow({ explicitUserAction: true, payload: request.positionPayload });
    if (posRes.status !== 'success') {
      return { status: posRes.status, error: posRes.error };
    }
    result.positions = posRes.positions;
  }

  // Cross reference validation upon restoration
  if ((request.mode === 'combined' || request.mode === 'full') && request.enforceCrossReferenceConsistency && result.groups && result.entis) {
    const validEntiIds = new Set(result.entis.map(e => e.id));
    for (const g of result.groups) {
      if (g.slots) {
        for (const [slotId, entiId] of Object.entries(g.slots)) {
          if (entiId && !validEntiIds.has(entiId)) {
            return { 
              status: 'controlled_error', 
              error: `Cross reference inconsistency during restore: Group ${g.id} slot ${slotId} refers to unknown Enti ${entiId}`
            };
          }
        }
      }
    }
  }

  return result;
}
