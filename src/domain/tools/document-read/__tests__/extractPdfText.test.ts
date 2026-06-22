import { describe, it, expect } from 'vitest';
import { extractPdfText } from '../extractPdfText';

describe('extractPdfText', () => {
  it('throws file_corrupt or empty on invalid pdf blob', async () => {
    // Polyfill DOMMatrix for JSDOM
    if (typeof globalThis.DOMMatrix === 'undefined') {
      (globalThis as unknown as { DOMMatrix: unknown }).DOMMatrix = class DOMMatrix {};
    }

    const fakeFile = new File(['not a pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    // Al pasar un archivo falso, el parser de pdfjs lanzará error, y el extractor lo mapea a 'file_corrupt'
    await expect(extractPdfText(fakeFile)).rejects.toThrow('file_corrupt');
  });

  // Nota: tests funcionales completos de parser de PDF requieren un Blob binario válido real de PDF en el entorno
});
