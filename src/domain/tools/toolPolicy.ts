import type { EntiToolAuthorization } from './entiToolAuthorization';
import type { ToolId, ToolBlockedReason } from './toolTypes';

export function isToolAuthorized(entiId: string, toolId: ToolId, authorizations: EntiToolAuthorization[]): boolean {
  return authorizations.some(auth => auth.entiId === entiId && auth.toolId === toolId && auth.state === 'authorized');
}

export function validateToolOwnership(ownerType: 'enti' | 'group' | string, entiId?: string): { success: boolean; reason?: ToolBlockedReason } {
  if (ownerType === 'group') {
    return { success: false, reason: 'group_owner_not_allowed' };
  }
  if (!entiId || entiId.trim() === '') {
    return { success: false, reason: 'invalid_owner' };
  }
  return { success: true };
}
