import type { ToolId, ToolState } from './toolTypes';

export interface EntiToolAuthorization {
  entiId: string;
  toolId: ToolId;
  state: ToolState;
}
