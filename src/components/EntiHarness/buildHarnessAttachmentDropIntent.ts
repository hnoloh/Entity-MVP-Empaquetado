export type HarnessDestinationScope = 'enti_knowledge' | 'enti_work_material';

export interface HarnessAttachmentDropIntent {
  status: 'valid' | 'blocked';
  scope: HarnessDestinationScope;
  reason?: string;
  files: File[];
}

export function buildHarnessAttachmentDropIntent(
  dataTransfer: DataTransfer | null,
  scope: HarnessDestinationScope,
  ownerType: string
): HarnessAttachmentDropIntent {
  if (ownerType !== 'enti') {
    return { status: 'blocked', scope, reason: 'El ownerType debe ser enti', files: [] };
  }

  if (!dataTransfer) {
    return { status: 'blocked', scope, reason: 'No se detectaron archivos', files: [] };
  }

  const files: File[] = [];
  
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      files.push(dataTransfer.files[i]);
    }
  } else if (dataTransfer.items) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
  }

  // Durante el dragover, WebKitGTK a menudo oculta toda evidencia de que es un archivo.
  // Por tanto, si no hay archivos (dragover o drop vacío), simplemente lo damos por válido para el hover visual.
  // Si resulta ser texto o un drop interceptado, fallará limpiamente en la fase de drop al no tener archivos.
  if (files.length === 0) {
    if (dataTransfer && dataTransfer.items && dataTransfer.items.length > 0) {
      let hasOnlyStrings = true;
      for (let i = 0; i < dataTransfer.items.length; i++) {
        if (dataTransfer.items[i].kind !== 'string') {
          hasOnlyStrings = false;
        }
      }
      if (hasOnlyStrings) {
        return { status: 'blocked', scope, reason: 'Contenido inválido', files: [] };
      }
    }
    return { status: 'valid', scope, files: [] };
  }

  return { status: 'valid', scope, files };
}
