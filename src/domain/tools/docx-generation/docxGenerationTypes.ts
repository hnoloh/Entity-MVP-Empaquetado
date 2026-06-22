import type { ToolId, ToolOperationResult } from '../toolTypes';

export interface DocxGenerationInput {
  entiId: string;
  toolId: ToolId;
  content: string;
  filename: string;
}

export interface DocxGenerationResult {
  status: ToolOperationResult;
  artifactId?: string;
  errorReason?: string;
}
