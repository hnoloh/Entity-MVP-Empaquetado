import type { EntiToolDefinition, EntiToolAuthorization } from '../../domain/tools';
import type { ToolBlockedReason, ToolState } from '../../domain/tools/toolTypes';

export interface EntiToolBeltItemViewModel {
  id: string;
  kind: string;
  name: string;
  description: string;
  state: ToolState;
  blockedReason?: ToolBlockedReason;
  indicatorStatus?: 'active' | 'in_use' | 'required_not_active' | 'controlled_error';
}

export function buildEntiToolBeltViewModel(
  entiId: string,
  registryDefinitions: Record<string, EntiToolDefinition>,
  authorizations: EntiToolAuthorization[],
  getIndicator: (toolId: string) => 'required_not_active' | 'in_use' | 'controlled_error' | 'active' | undefined = () => undefined
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
      if (def.riskLevel === 'critical') {
        state = 'blocked';
        blockedReason = 'risk_not_authorized';
      }
    }
    
    let indicatorStatus: 'active' | 'in_use' | 'required_not_active' | 'controlled_error' | undefined = getIndicator(toolId);

    if (!indicatorStatus) {
      if (state === 'in_use') {
        indicatorStatus = 'in_use';
      } else if (state === 'controlled_error') {
        indicatorStatus = 'controlled_error';
      } else if (state === 'authorized') {
        indicatorStatus = 'active';
      }
    }
    
    items.push({
      id: toolId,
      kind: def.kind,
      name: def.name,
      description: def.description,
      state,
      blockedReason,
      indicatorStatus,
    });
  }
  
  return items;
}
