export type AttachmentDropIntent = {
  ownerType: 'enti' | 'group';
  ownerId: string;
  chatId: string;
  metadata: {
    fileName: string;
    fileExtension: string;
    mimeType: string;
    sizeBytes: number;
    source: string;
  };
};

export function buildAttachmentDropIntent(
  file: File,
  ownerType: 'enti' | 'group',
  ownerId: string,
  chatId: string
): AttachmentDropIntent {
  const extensionMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';

  return {
    ownerType,
    ownerId,
    chatId,
    metadata: {
      fileName: file.name,
      fileExtension: extension,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      source: 'drag_and_drop'
    }
  };
}
