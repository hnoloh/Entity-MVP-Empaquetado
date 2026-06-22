import type { DocumentReadExtractedContent } from './documentReadToolTypes';

// Configure worker for Vite. 
// Using the recommended way for Vite + pdfjs-dist.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

export async function extractPdfText(file: File | Blob): Promise<DocumentReadExtractedContent> {
  // Dynamically import pdfjs-dist to prevent DOMMatrix ReferenceErrors in JSDOM
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: unknown) => (item as { str: string }).str).join(' ');
      fullText += pageText + '\n\n';
    }

    const rawText = fullText.trim();
    if (!rawText) {
      throw new Error('PDF is empty or text could not be extracted');
    }

    const wordCount = rawText.split(/\s+/).filter(word => word.length > 0).length;

    return {
      rawText,
      normalizedText: rawText, // In a real scenario, you could clean up excessive whitespace/newlines
      pageCount: pdf.numPages,
      wordCount
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'PasswordException') {
        throw new Error('file_protected', { cause: error });
      }
      if (error.message.includes('empty')) {
        throw new Error('file_empty', { cause: error });
      }
    }
    throw new Error('file_corrupt', { cause: error });
  }
}
