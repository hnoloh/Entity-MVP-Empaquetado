import type { EntiToolDefinition } from './entiToolDefinition';
import type { EntiToolAuthorization } from './entiToolAuthorization';
import type { ToolId } from './toolTypes';

export interface EntiToolRegistry {
  definitions: Record<ToolId, EntiToolDefinition>;
  authorizations: EntiToolAuthorization[];
}
