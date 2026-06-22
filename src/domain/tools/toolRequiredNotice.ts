import { evaluateDocumentReadToolRequirement } from './documentReadToolRequirement';
import type { EntiToolAuthorization } from './entiToolAuthorization';

export type ToolNoticeContext = 'chat_enti' | 'harness_enti' | 'group_sequence';

export interface ToolRequiredNotice {
  context: ToolNoticeContext;
  entiId: string;
  toolId: string;
  severity: 'warning' | 'info';
  message: string;
}

export function generateToolRequiredNoticeForDocument(
  fileName: string,
  mimeType: string,
  context: ToolNoticeContext,
  entiId: string,
  activeAuthorizations: EntiToolAuthorization[]
): ToolRequiredNotice | null {
  const req = evaluateDocumentReadToolRequirement(fileName, mimeType);
  if (!req.requiresTool || !req.toolId) return null;

  const isAuthorized = activeAuthorizations.some(
    a => a.entiId === entiId && a.toolId === req.toolId && a.state === 'authorized'
  );

  if (isAuthorized) return null;

  let message = '';
  switch (context) {
    case 'chat_enti':
      message = `El archivo "${fileName}" requiere la Tool Leer Documento. Actívala en el EntiEditor para extraer su contenido.`;
      break;
    case 'harness_enti':
      message = `Para procesar "${fileName}" como conocimiento o material de trabajo, debes activar la Tool Leer Documento.`;
      break;
    case 'group_sequence':
      message = `El Enti principal ("${entiId}") requiere la Tool Leer Documento para leer "${fileName}" en el contexto del Grupo.`;
      break;
  }

  return {
    context,
    entiId,
    toolId: req.toolId,
    severity: 'warning',
    message
  };
}
