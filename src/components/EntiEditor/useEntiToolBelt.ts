/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useCallback, useEffect } from 'react';
import type { EntiToolRegistry } from '../../domain/tools';
import { toggleToolAuthorization } from '../../domain/tools';
import { buildEntiToolBeltViewModel } from './buildEntiToolBeltViewModel';
import { toolAuthorizationRepository } from '../../domain/tools/toolAuthorizationRepository';
import { toolIndicatorRepository } from '../../domain/tools/toolIndicatorRepository';
import { MOCK_REGISTRY_BASE } from '../../domain/tools/mockRegistry';

export function useEntiToolBelt(entiId: string) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubAuth = toolAuthorizationRepository.subscribe(() => setTick(t => t + 1));
    const unsubInd = toolIndicatorRepository.subscribe(() => setTick(t => t + 1));
    return () => {
      unsubAuth();
      unsubInd();
    };
  }, []);

  const currentAuths = toolAuthorizationRepository.list();

  const viewModel = useMemo(() => {
    // We include `tick` to force re-evaluation of indicators when global store updates
    return buildEntiToolBeltViewModel(entiId, MOCK_REGISTRY_BASE.definitions, currentAuths, (toolId) => toolIndicatorRepository.getIndicator(entiId, toolId) as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entiId, currentAuths, tick]);

  const toggleAuthorization = useCallback((toolId: string) => {
    const virtualRegistry: EntiToolRegistry = {
      ...MOCK_REGISTRY_BASE,
      authorizations: toolAuthorizationRepository.list()
    };

    const result = toggleToolAuthorization(entiId, toolId, virtualRegistry);
    if (result.success) {
      toolAuthorizationRepository.save(result.newAuthorizations);
      return { success: true };
    } else {
      return { success: false, reason: result.reason };
    }
  }, [entiId]);
  
  return { tools: viewModel, toggleAuthorization };
}
