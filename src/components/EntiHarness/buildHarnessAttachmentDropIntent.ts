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

  if (!dataTransfer || !dataTransfer.items || dataTransfer.items.length === 0) {
    return { status: 'blocked', scope, reason: 'No se detectaron archivos', files: [] };
  }

  const files: File[] = [];
  let blocked = false;
  let hasFiles = false;
  
  for (let i = 0; i < dataTransfer.items.length; i++) {
    const item = dataTransfer.items[i];
    if (item.kind === 'file') {
      hasFiles = true;
      const file = item.getAsFile();
      if (file) {
        files.push(file);
      }
    } else {
      blocked = true;
    }
  }

  // During dragover, getAsFile() returns null, so files array will be empty
  // but hasFiles will be true. We only block if there are NO files detected.
  if (blocked || !hasFiles) {
    return { status: 'blocked', scope, reason: 'Contenido inválido en Drop', files: [] };
  }

  return { status: 'valid', scope, files };
}
