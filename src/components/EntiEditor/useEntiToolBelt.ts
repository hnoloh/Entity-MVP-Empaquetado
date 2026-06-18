import { useMemo } from 'react';
import { EntiToolRegistry } from '../../domain/tools';
import { buildEntiToolBeltViewModel } from './buildEntiToolBeltViewModel';

const MOCK_REGISTRY: EntiToolRegistry = {
  definitions: {
    'tool-read-doc': { id: 'tool-read-doc', kind: 'document_read', name: 'Leer Documento', description: 'Lee PDF/DOCX', riskLevel: 'low' },
    'tool-gen-pdf': { id: 'tool-gen-pdf', kind: 'generate_pdf', name: 'Generar PDF', description: 'Genera archivo PDF', riskLevel: 'medium' },
    'tool-gen-docx': { id: 'tool-gen-docx', kind: 'generate_docx', name: 'Generar DOCX', description: 'Genera archivo DOCX', riskLevel: 'medium' },
    'tool-gen-txt': { id: 'tool-gen-txt', kind: 'generate_text_artifact', name: 'Generar TXT', description: 'Genera texto plano', riskLevel: 'medium' },
    'tool-dl': { id: 'tool-dl', kind: 'download_generated_artifact', name: 'Descargar Artefacto', description: 'Descarga un artefacto', riskLevel: 'low' },
    'tool-net': { id: 'tool-net', kind: 'internet', name: 'Internet', description: 'Acceso a la web', riskLevel: 'high' },
    'tool-fs': { id: 'tool-fs', kind: 'local_filesystem', name: 'Filesystem', description: 'Acceso a disco local', riskLevel: 'critical' },
  },
  authorizations: []
};

export function useEntiToolBelt(entiId: string) {
  const viewModel = useMemo(() => {
    return buildEntiToolBeltViewModel(entiId, MOCK_REGISTRY.definitions, MOCK_REGISTRY.authorizations);
  }, [entiId]);
  
  return { tools: viewModel };
}
