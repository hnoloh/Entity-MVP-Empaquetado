import type { PdfGenerationInput, PdfGenerationResult } from './pdfGenerationTypes';
import { PdfGenerationPolicy } from './pdfGenerationPolicy';
import { generatePdfArtifact } from './generatePdfArtifact';
import { generatedArtifactRegistry } from '../generated-artifacts';
import { toolIndicatorRepository } from '../toolIndicatorRepository';

import { writeTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';

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

      // Save to disk ONLY if targetPath is explicitly provided
      if (input.targetPath) {
        const dirPath = input.targetPath.replace(/\/$/, '');
        let isDesktop = false;
        if (dirPath.toLowerCase().endsWith('escritorio') || dirPath === '..') {
          isDesktop = true;
        }
        
        const finalFilename = input.filename.endsWith('.pdf') ? input.filename : `${input.filename}.pdf`;
        const savePath = isDesktop ? finalFilename.replace(/^\//, '') : dirPath + '/' + finalFilename.replace(/^\//, '');

        try {
          if (isDesktop) {
            await writeTextFile(savePath, input.content, { baseDir: BaseDirectory.Desktop });
          } else {
            try { await mkdir(dirPath, { recursive: true }); } catch { /* ignore if exists */ }
            await writeTextFile(savePath, input.content);
          }
        } catch (fsErr) {
          console.error("FS Error:", fsErr);
          throw fsErr;
        }
      }

      this.indicators.setIndicator(input.entiId, input.toolId, 'active');
      return {
        status: 'success',
        artifactId: artifact.artifactId
      };
    } catch (err: unknown) {
      // Avoid throwing again if indicators fail
      try { this.indicators.setIndicator(input.entiId, input.toolId, 'controlled_error'); } catch { /* ignore */ }
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Unknown error');
      return { status: 'controlled_error', errorReason: errorMessage };
    }
  }
}

export const pdfGenerationToolExecutor = new PdfGenerationToolExecutor();
