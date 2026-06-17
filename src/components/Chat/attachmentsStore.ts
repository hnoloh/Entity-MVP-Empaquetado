import type { Attachment } from '../../domain/attachments/attachmentModel';

class AttachmentsStore {
  private attachments: Attachment[] = [];
  private listeners: Set<() => void> = new Set();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    this.listeners.forEach(l => l());
  }

  private chatCache = new Map<string, Attachment[]>();

  addAttachment(attachment: Attachment) {
    this.attachments = [...this.attachments, attachment];
    this.chatCache.clear();
    this.emit();
  }

  getAttachmentsForChat(chatId: string): Attachment[] {
    if (!this.chatCache.has(chatId)) {
      this.chatCache.set(chatId, this.attachments.filter(a => a.chatId === chatId));
    }
    return this.chatCache.get(chatId)!;
  }

  clearChat(chatId: string) {
    this.attachments = this.attachments.filter(a => a.chatId !== chatId);
    this.chatCache.delete(chatId);
    this.emit();
  }

  clear() {
    this.attachments = [];
    this.chatCache.clear();
    this.emit();
  }
}

export const attachmentsStore = new AttachmentsStore();

if (typeof window !== 'undefined') {
  window.addEventListener('chat-history-cleared', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail && customEvent.detail.chatId) {
      attachmentsStore.clearChat(customEvent.detail.chatId);
    }
  });
}
