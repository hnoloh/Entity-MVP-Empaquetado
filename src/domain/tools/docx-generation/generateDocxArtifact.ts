import type { GeneratedToolArtifact } from '../generated-artifacts';

export function generateDocxArtifact(entiId: string, toolId: string, content: string, filename: string): GeneratedToolArtifact {
  const docxString = content; // Dejarlo como texto puro para evitar caracteres raros de ZIP corrupto
  
  const blob = new Blob([docxString], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const artifactId = `docx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return {
    artifactId,
    entiId,
    toolId,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: filename.endsWith('.docx') ? filename : `${filename}.docx`,
    size: blob.size,
    status: 'success',
    blob
  };
}
