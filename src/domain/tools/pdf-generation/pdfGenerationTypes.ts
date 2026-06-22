import type { ToolId, ToolOperationResult } from '../toolTypes';

export interface PdfGenerationInput {
  entiId: string;
  toolId: ToolId;
  content: string;
  filename: string;
}

export interface PdfGenerationResult {
  status: ToolOperationResult;
  artifactId?: string;
  errorReason?: string;
}
