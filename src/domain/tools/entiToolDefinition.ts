import type { ToolId, ToolKind, ToolRiskLevel } from './toolTypes';

export interface EntiToolDefinition {
  id: ToolId;
  kind: ToolKind;
  name: string;
  description: string;
  riskLevel: ToolRiskLevel;
}
