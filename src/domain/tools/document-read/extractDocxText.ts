// @ts-expect-error - missing types for mammoth
import * as mammoth from 'mammoth/mammoth.browser';
import type { DocumentReadExtractedContent } from './documentReadToolTypes';

export async function extractDocxText(file: File | Blob): Promise<DocumentReadExtractedContent> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // mammoth expects a buffer or arrayBuffer
    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = result.value.trim();

    if (!rawText) {
      throw new Error('file_empty');
    }

    const wordCount = rawText.split(/\s+/).filter((word: string) => word.length > 0).length;

    return {
      rawText,
      normalizedText: rawText,
      wordCount
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'file_empty') {
      throw error;
    }
    // Fallback: si falla mammoth (ej. no es un zip real sino un falso docx de texto plano que generamos nosotros)
    try {
      const rawText = await file.text();
      if (rawText && rawText.trim()) {
        const trimmed = rawText.trim();
        return {
          rawText: trimmed,
          normalizedText: trimmed,
          wordCount: trimmed.split(/\s+/).filter((word: string) => word.length > 0).length
        };
      }
    } catch {
      // Ignore text fallback error
    }
    throw new Error('file_corrupt', { cause: error });
  }
}
