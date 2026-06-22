import type { PdfGenerationInput, PdfGenerationResult } from './pdfGenerationTypes';
import { PdfGenerationPolicy } from './pdfGenerationPolicy';
import { generatePdfArtifact } from './generatePdfArtifact';
import { generatedArtifactRegistry } from '../generated-artifacts';
import { toolIndicatorRepository } from '../toolIndicatorRepository';

export class PdfGenerationToolExecutor {
  constructor(
    private policy: PdfGenerationPolicy = new PdfGenerationPolicy(),
    private registry = generatedArtifactRegistry,
    private indicators = toolIndicatorRepository
  ) {}

  async execute(input: PdfGenerationInput): Promise<PdfGenerationResult> {
    try {
      this.indicators.setIndicator(input.entiId, input.toolId, 'in_use');
      
      const validation = this.policy.validate(input);
      if (!validation.allowed) {
        this.indicators.setIndicator(input.entiId, input.toolId, 'blocked');
        return { status: 'blocked', errorReason: validation.reason };
      }

      const artifact = generatePdfArtifact(input.entiId, input.toolId, input.content, input.filename);
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

export const pdfGenerationToolExecutor = new PdfGenerationToolExecutor();
