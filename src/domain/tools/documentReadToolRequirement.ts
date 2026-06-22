export interface DocumentReadToolRequirementResult {
  requiresTool: boolean;
  toolId?: string;
  reason?: string;
}

export function evaluateDocumentReadToolRequirement(
  fileName: string,
  mimeType: string
): DocumentReadToolRequirementResult {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const isPdf = ext === 'pdf' || mimeType === 'application/pdf';
  const isDocx = ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (isPdf || isDocx) {
    return {
      requiresTool: true,
      toolId: 'tool-read-doc',
      reason: 'El archivo adjunto requiere la Tool Leer Documento activa para extraer su contenido contextual.'
    };
  }

  return { requiresTool: false };
}
