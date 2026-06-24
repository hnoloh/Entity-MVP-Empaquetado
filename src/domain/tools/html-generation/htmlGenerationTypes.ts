import type { ToolId } from '../toolTypes';
import type { GeneratedArtifactId } from '../generated-artifacts/generatedArtifactTypes';

export interface HtmlGenerationInput {
  entiId: string;
  toolId: ToolId;
  filename: string;
  htmlContent: string;
  targetPath?: string;
  metadata?: Record<string, string>;
}

export interface HtmlGenerationPolicyResult {
  allowed: boolean;
  reason?: string;
}

export interface HtmlGenerationResult {
  status: 'success' | 'blocked' | 'controlled_error';
  artifactId?: GeneratedArtifactId;
  reason?: string;
  error?: string;
}
