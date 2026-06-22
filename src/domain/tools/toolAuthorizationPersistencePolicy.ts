import type { EntiToolRegistry } from './entiToolRegistry';
import { validateToolOwnership } from './toolPolicy';

export interface ToolAuthorizationPersistencePolicyResult {
  success: boolean;
  reason?: string;
}

export function validateToolAuthorizationForPersistence(
  entiId: string,
  toolId: string,
  registry: EntiToolRegistry
): ToolAuthorizationPersistencePolicyResult {
  const ownershipValidation = validateToolOwnership(entiId === 'group' ? 'group' : 'enti', entiId);
  if (!ownershipValidation.success) {
    return { success: false, reason: ownershipValidation.reason };
  }

  const toolDef = registry.definitions[toolId];
  if (!toolDef) {
    return { success: false, reason: 'unknown_tool' };
  }

  // Si tiene risk level high o critical y no tiene autorizacion explicita en registry, no deberia guardarse ni restaurarse a la ligera.
  // Pero wait: al restaurar, el registry (MOCK_REGISTRY_BASE) no tiene authorizations por defecto.
  // Por lo tanto, tools high/critical fallarán esta validación si exigimos que ya estén autorizadas.
  // La SPEC dice: "Valida que solo se persistan tools conocidas, autorizables y pertenecientes a Enti."
  // Autorizables significa que pueden ser autorizadas por un Enti.
  // Si riskLevel === 'critical' || riskLevel === 'high', no pueden ser autorizadas implícitamente por click en MVP (devuelve risk_not_authorized).
  // Por tanto, si vienen en el snapshot, también deben descartarse a menos que cambiemos la política.
  
  if (toolDef.riskLevel === 'high' || toolDef.riskLevel === 'critical') {
     return { success: false, reason: 'risk_not_authorized' };
  }

  return { success: true };
}
