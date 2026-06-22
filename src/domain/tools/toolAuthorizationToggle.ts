import type { EntiToolAuthorization } from './entiToolAuthorization';
import type { EntiToolRegistry } from './entiToolRegistry';
import { validateToolOwnership } from './toolPolicy';

export type ToggleAuthorizationResult = 
  | { success: true; newAuthorizations: EntiToolAuthorization[] }
  | { success: false; reason: string };

export function toggleToolAuthorization(
  entiId: string, 
  toolId: string, 
  registry: EntiToolRegistry
): ToggleAuthorizationResult {
  const ownerType = entiId === 'group' ? 'group' : 'enti';
  const ownershipValidation = validateToolOwnership(ownerType, entiId);
  
  if (!ownershipValidation.success) {
    return { success: false, reason: ownershipValidation.reason! };
  }

  const toolDef = registry.definitions[toolId];
  if (!toolDef) {
    return { success: false, reason: 'unknown_tool' };
  }

  const existingAuthIndex = registry.authorizations.findIndex(
    a => a.entiId === entiId && a.toolId === toolId
  );

  const newAuthorizations = [...registry.authorizations];

  if (existingAuthIndex >= 0) {
    const auth = newAuthorizations[existingAuthIndex];
    if (auth.state === 'authorized') {
      newAuthorizations.splice(existingAuthIndex, 1);
    } else if (auth.state === 'blocked') {
      return { success: false, reason: 'tool_not_authorized' };
    } else {
       newAuthorizations[existingAuthIndex] = { ...auth, state: 'authorized' };
    }
  } else {
    if (toolDef.riskLevel === 'critical') {
      return { success: false, reason: 'risk_not_authorized' };
    }

    newAuthorizations.push({
      entiId,
      toolId,
      state: 'authorized'
    });
  }

  return { success: true, newAuthorizations };
}
