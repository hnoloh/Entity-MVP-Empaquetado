import type { DocxGenerationInput, DocxGenerationResult } from './docxGenerationTypes';
import { DocxGenerationPolicy } from './docxGenerationPolicy';
import { generateDocxArtifact } from './generateDocxArtifact';
import { generatedArtifactRegistry } from '../generated-artifacts';
import { toolIndicatorRepository } from '../toolIndicatorRepository';

import { writeTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';

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

      // Generate the virtual artifact
      const artifact = generateDocxArtifact(input.entiId, input.toolId, input.content, input.filename);
      this.registry.registerArtifact(artifact);

      // Save to disk ONLY if targetPath is explicitly provided
      if (input.targetPath) {
        const dirPath = input.targetPath.replace(/\/$/, '');
        let isDesktop = false;
        if (dirPath.toLowerCase().endsWith('escritorio') || dirPath === '..') {
          isDesktop = true;
        }
        
        const finalFilename = input.filename.endsWith('.docx') ? input.filename : `${input.filename}.docx`;
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

export const docxGenerationToolExecutor = new DocxGenerationToolExecutor();
