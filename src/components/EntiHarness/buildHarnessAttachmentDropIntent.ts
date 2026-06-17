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
  
  for (let i = 0; i < dataTransfer.items.length; i++) {
    const item = dataTransfer.items[i];
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) {
        files.push(file);
      }
    } else {
      blocked = true;
    }
  }

  if (blocked || files.length === 0) {
    return { status: 'blocked', scope, reason: 'Contenido inválido en Drop', files: [] };
  }

  return { status: 'valid', scope, files };
}
