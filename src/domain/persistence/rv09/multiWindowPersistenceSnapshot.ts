import type { ChatWindowPersistenceDescriptor } from './chatWindowPersistenceDescriptor';

export interface MultiWindowPersistenceSnapshot {
  openChats: ChatWindowPersistenceDescriptor[];
}
