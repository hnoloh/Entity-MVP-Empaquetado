import type { GeneratedToolArtifact } from '../generated-artifacts';

export function generatePdfArtifact(entiId: string, toolId: string, content: string, filename: string): GeneratedToolArtifact {
  // Minimal serializable PDF structure
  const pdfString = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n4 0 obj\n<< /Length ${content.length + 50} >>\nstream\nBT\n/F1 12 Tf\n10 700 Td\n(${content.replace(/[()]/g, '')}) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n345\n%%EOF`;
  
  const blob = new Blob([pdfString], { type: 'application/pdf' });
  const artifactId = `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return {
    artifactId,
    entiId,
    toolId,
    mimeType: 'application/pdf',
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    size: blob.size,
    status: 'success',
    blob
  };
}
