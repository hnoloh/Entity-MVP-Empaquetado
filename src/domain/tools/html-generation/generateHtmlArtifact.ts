import type { GeneratedToolArtifact } from '../generated-artifacts/generatedArtifactTypes';

export function generateHtmlArtifact(entiId: string, toolId: string, content: string, filename: string): GeneratedToolArtifact {
  const blob = new Blob([content], { type: 'text/html' });
  const artifactId = `html-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return {
    artifactId,
    entiId,
    toolId,
    mimeType: 'text/html',
    filename: filename.endsWith('.html') ? filename : `${filename}.html`,
    size: blob.size,
    status: 'success',
    blob
  };
}
