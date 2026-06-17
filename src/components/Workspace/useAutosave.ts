import { useEffect, useRef } from 'react';
import { storage } from '../../infrastructure/storage/indexedDbStorage';
import { runPersistenceHarnessFlow } from '../../domain/persistence/persistenceHarness';
import { loadPersistedOperationalStateFlow } from '../../domain/lifecycle/loadPersistedOperationalStateFlow';
import { chatRepository } from '../../domain/chat/chatRepository';
import type { Group } from '../../domain/group/Group';
import type { Enti } from '../../domain/enti/Enti';

const SNAPSHOT_ID = 'main-workspace';

export function useAutosave(
  entis: Enti[],
  grupos: Group[],
  onRestoreGroups: (restoredGroups: Group[]) => void,
  onRestoreEntis: (restoredEntis: Enti[]) => void,
  triggerSave: number,
  lifecyclePhaseAuthorized: boolean
) {
  const loadedRef = useRef(false);

  // Carga inicial
  useEffect(() => {
    async function load() {
      try {
        const result = await loadPersistedOperationalStateFlow({
          lifecyclePhaseAuthorized: lifecyclePhaseAuthorized,
          snapshotId: SNAPSHOT_ID
        });

        if (result.status === 'success') {
          if (result.restoredEntis) onRestoreEntis(result.restoredEntis);
          if (result.restoredGroups) onRestoreGroups(result.restoredGroups);
        } else if (result.status === 'controlled_error') {
          console.error('Failed to restore snapshot:', result.error);
        }
      } catch (err) {
        console.error('Failed to load from storage', err);
      } finally {
        loadedRef.current = true;
      }
    }
    
    if (lifecyclePhaseAuthorized && !loadedRef.current) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifecyclePhaseAuthorized]);

  // Autosave al haber cambios
  useEffect(() => {
    if (!loadedRef.current) return;

    const timeout = setTimeout(() => {
      // Extraemos positions de los grupos
      const positions = grupos.map(g => ({
        groupId: g.id,
        slots: g.slots || {}
      }));

      const persistResult = runPersistenceHarnessFlow({
        explicitUserAction: true,
        action: 'persist',
        mode: 'full',
        entis,
        groups: grupos,
        chats: chatRepository.list(),
        sequences: [], // Secuencias no implementadas en memoria aún
        positions
      });

      if (persistResult.status === 'success') {
        const payload = {
          root: 'operational_restore' as const,
          version: '1.0',
          data: {
            entiPayload: persistResult.entiPayload,
            groupPayload: persistResult.groupPayload,
            cognitivePayload: persistResult.cognitivePayload,
            chatPayload: persistResult.chatPayload,
            sequencePayload: persistResult.sequencePayload,
            positionPayload: persistResult.positionPayload
          }
        };
        storage.saveSnapshot(SNAPSHOT_ID, payload).catch(err => {
          console.error('Failed to save snapshot to storage:', err);
        });
      } else {
        console.error('Failed to generate persistence payload:', persistResult.error);
      }
    }, 1000); // Debounce de 1s

    return () => clearTimeout(timeout);
  }, [entis, grupos, triggerSave]);
}
