import { EntiToolDefinition } from './entiToolDefinition';
import { EntiToolAuthorization } from './entiToolAuthorization';
import { ToolId } from './toolTypes';

export interface EntiToolRegistry {
  definitions: Record<ToolId, EntiToolDefinition>;
  authorizations: EntiToolAuthorization[];
}
