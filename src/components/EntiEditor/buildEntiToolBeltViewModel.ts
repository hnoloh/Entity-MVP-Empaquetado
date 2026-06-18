import { EntiToolDefinition, EntiToolAuthorization } from '../../domain/tools';
import { ToolBlockedReason, ToolState } from '../../domain/tools/toolTypes';

export interface EntiToolBeltItemViewModel {
  id: string;
  kind: string;
  name: string;
  description: string;
  state: ToolState;
  blockedReason?: ToolBlockedReason;
}

export function buildEntiToolBeltViewModel(
  entiId: string,
  registryDefinitions: Record<string, EntiToolDefinition>,
  authorizations: EntiToolAuthorization[]
): EntiToolBeltItemViewModel[] {
  const items: EntiToolBeltItemViewModel[] = [];
  
  if (entiId === 'group') {
    return [];
  }
  
  for (const [toolId, def] of Object.entries(registryDefinitions)) {
    const auth = authorizations.find(a => a.toolId === toolId && a.entiId === entiId);
    
    let state: ToolState = 'available';
    let blockedReason: ToolBlockedReason | undefined;
    
    if (auth) {
      state = auth.state;
      if (state === 'blocked') {
        blockedReason = 'tool_not_authorized';
      }
    } else {
      if (def.riskLevel === 'high' || def.riskLevel === 'critical') {
        state = 'blocked';
        blockedReason = 'risk_not_authorized';
      }
    }
    
    items.push({
      id: toolId,
      kind: def.kind,
      name: def.name,
      description: def.description,
      state,
      blockedReason,
    });
  }
  
  return items;
}
