import type { EntiToolRegistry } from './entiToolRegistry';

export const MOCK_REGISTRY_BASE: EntiToolRegistry = {
  definitions: {
    'tool-read-doc': { id: 'tool-read-doc', kind: 'document_read', name: 'Leer Documento', description: 'Lee PDF/DOCX', riskLevel: 'low' },
    'tool-gen-pdf': { id: 'tool-gen-pdf', kind: 'generate_pdf', name: 'Generar PDF', description: 'Genera archivo PDF', riskLevel: 'medium' },
    'tool-gen-docx': { id: 'tool-gen-docx', kind: 'generate_docx', name: 'Generar DOCX', description: 'Genera archivo DOCX', riskLevel: 'medium' },
    'tool-gen-html': { id: 'tool-gen-html', kind: 'generate_html', name: 'Generar HTML', description: 'Genera archivo HTML', riskLevel: 'medium' },
    'tool-dl': { id: 'tool-dl', kind: 'download_generated_artifact', name: 'Descargar Artefacto', description: 'Descarga un artefacto', riskLevel: 'low' },
    'tool-fs': { id: 'tool-fs', kind: 'local_filesystem', name: 'Filesystem', description: 'Acceso a disco local', riskLevel: 'low' },
  },
  authorizations: []
};
