import type { OperationalRestorePayload } from '../../domain/persistence/operationalRestore';

const DB_NAME = 'EntityWorkspaceDB';
const STORE_NAME = 'WorkspaceSnapshots';
const DB_VERSION = 1;

export class IndexedDbStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback = new Map<string, OperationalRestorePayload>();
  private useMemory = false;

  constructor() {
    const isAvailable = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
    if (!isAvailable) {
      this.useMemory = true;
      return;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async saveSnapshot(id: string, payload: OperationalRestorePayload): Promise<void> {
    if (this.useMemory) {
      this.memoryFallback.set(id, JSON.parse(JSON.stringify(payload)));
      return;
    }
    const db = await this.dbPromise!;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id, payload, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async loadSnapshot(id: string): Promise<OperationalRestorePayload | null> {
    if (this.useMemory) {
      const data = this.memoryFallback.get(id);
      return data ? JSON.parse(JSON.stringify(data)) : null;
    }
    const db = await this.dbPromise!;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        resolve(result ? result.payload : null);
      };

      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }
}

export const storage = new IndexedDbStorage();
