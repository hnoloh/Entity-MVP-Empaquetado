import type { DocxGenerationInput, DocxGenerationResult } from './docxGenerationTypes';
import { DocxGenerationPolicy } from './docxGenerationPolicy';
import { generateDocxArtifact } from './generateDocxArtifact';
import { generatedArtifactRegistry } from '../generated-artifacts';
import { toolIndicatorRepository } from '../toolIndicatorRepository';

export class DocxGenerationToolExecutor {
  constructor(
    private policy: DocxGenerationPolicy = new DocxGenerationPolicy(),
    private registry = generatedArtifactRegistry,
    private indicators = toolIndicatorRepository
  ) {}

  async execute(input: DocxGenerationInput): Promise<DocxGenerationResult> {
    try {
      this.indicators.setIndicator(input.entiId, input.toolId, 'in_use');
      
      const validation = this.policy.validate(input);
      if (!validation.allowed) {
        this.indicators.setIndicator(input.entiId, input.toolId, 'blocked');
        return { status: 'blocked', errorReason: validation.reason };
      }

      const artifact = generateDocxArtifact(input.entiId, input.toolId, input.content, input.filename);
      this.registry.registerArtifact(artifact);

      this.indicators.setIndicator(input.entiId, input.toolId, 'active');
      return {
        status: 'success',
        artifactId: artifact.artifactId
      };
    } catch (err: unknown) {
      // Avoid throwing again if indicators fail
      try { this.indicators.setIndicator(input.entiId, input.toolId, 'controlled_error'); } catch { /* ignore */ }
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { status: 'controlled_error', errorReason: errorMessage };
    }
  }
}

export const docxGenerationToolExecutor = new DocxGenerationToolExecutor();
