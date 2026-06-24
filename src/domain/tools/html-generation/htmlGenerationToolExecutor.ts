import type { HtmlGenerationInput, HtmlGenerationResult } from './htmlGenerationTypes';
import { htmlGenerationPolicy } from './htmlGenerationPolicy';
import { generateHtmlArtifact } from './generateHtmlArtifact';
import { generatedArtifactRegistry } from '../generated-artifacts';
import { toolIndicatorRepository } from '../toolIndicatorRepository';

import { writeTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';

export class HtmlGenerationToolExecutor {
  constructor(
    private policy = htmlGenerationPolicy,
    private registry = generatedArtifactRegistry,
    private indicators = toolIndicatorRepository
  ) {}

  async execute(input: HtmlGenerationInput): Promise<HtmlGenerationResult> {
    try {
      this.indicators.setIndicator(input.entiId, input.toolId, 'in_use');
      
      const validation = this.policy(input);
      if (!validation.allowed) {
        this.indicators.setIndicator(input.entiId, input.toolId, 'blocked');
        return { status: 'blocked', reason: validation.reason };
      }

      const artifact = generateHtmlArtifact(input.entiId, input.toolId, input.htmlContent, input.filename);
      this.registry.registerArtifact(artifact);

      // Save to disk ONLY if targetPath is explicitly provided
      if (input.targetPath) {
        let dirPath = input.targetPath.replace(/\/$/, '');
        let isDesktop = false;
        if (dirPath.toLowerCase().endsWith('escritorio') || dirPath === '..') {
          isDesktop = true;
        }
        
        const finalFilename = input.filename.endsWith('.html') ? input.filename : `${input.filename}.html`;
        const savePath = isDesktop ? finalFilename.replace(/^\//, '') : dirPath + '/' + finalFilename.replace(/^\//, '');

        try {
          if (isDesktop) {
            await writeTextFile(savePath, input.htmlContent, { baseDir: BaseDirectory.Desktop });
          } else {
            try { await mkdir(dirPath, { recursive: true }); } catch { /* ignore if exists */ }
            await writeTextFile(savePath, input.htmlContent);
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
      return { status: 'controlled_error', error: errorMessage };
    }
  }
}

export const htmlGenerationToolExecutor = new HtmlGenerationToolExecutor();
