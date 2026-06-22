import type { DocumentReadToolInput, DocumentReadToolResult, DocumentReadControlledError } from './documentReadToolTypes';
import { documentReadToolPolicy } from './documentReadToolPolicy';
import { extractPdfText } from './extractPdfText';
import { extractDocxText } from './extractDocxText';

export async function documentReadToolExecutor(input: DocumentReadToolInput): Promise<DocumentReadToolResult> {
  // 1. Validar política
  const policy = documentReadToolPolicy(input);
  if (policy.status === 'blocked') {
    return { status: 'blocked', blockedReason: policy.reason };
  }

  // 2. Extraer contenido
  try {
    const ext = input.fileExtension.toLowerCase();
    let content;

    if (ext === 'pdf') {
      content = await extractPdfText(input.fileRef);
    } else if (ext === 'docx') {
      content = await extractDocxText(input.fileRef);
    } else {
      // Debería estar bloqueado por la policy antes
      return { status: 'blocked', blockedReason: 'invalid_format' };
    }

    // 3. Devolver resultado exitoso
    return {
      status: 'success',
      content
    };

  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message as DocumentReadControlledError;
      if (['file_corrupt', 'file_protected', 'file_empty', 'parser_unavailable'].includes(msg)) {
        return { status: 'controlled_error', errorReason: msg, errorMessage: msg };
      }
      return { status: 'controlled_error', errorReason: 'unknown_read_error', errorMessage: error.message };
    }
    return { status: 'controlled_error', errorReason: 'unknown_read_error', errorMessage: 'Unknown error occurred during extraction' };
  }
}
