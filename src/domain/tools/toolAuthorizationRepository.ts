import type { EntiToolAuthorization } from './entiToolAuthorization';

import { isToolAuthorized } from './toolPolicy';
import type { ToolId } from './toolTypes';

export interface ToolAuthorizationRepository {
  save(auths: EntiToolAuthorization[]): void;
  list(): EntiToolAuthorization[];
  clear(): void;
  subscribe(listener: () => void): () => void;
  isToolAuthorized(entiId: string, toolId: string): boolean;
}

class InMemoryToolAuthorizationRepository implements ToolAuthorizationRepository {
  private authorizations: EntiToolAuthorization[] = [];
  private listeners = new Set<() => void>();

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'tool_authorizations') {
          this.loadFromStorage();
          this.emit();
        }
      });
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('tool_authorizations');
      if (stored) {
        this.authorizations = JSON.parse(stored);
      } else {
        this.authorizations = [];
      }
    } catch (e) {
      console.error('Failed to load tool authorizations', e);
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    this.listeners.forEach(l => l());
  }

  save(auths: EntiToolAuthorization[]): void {
    this.authorizations = [...auths];
    try {
      localStorage.setItem('tool_authorizations', JSON.stringify(this.authorizations));
    } catch (e) {
      console.error('Failed to save tool authorizations', e);
    }
    this.emit();
  }

  list(): EntiToolAuthorization[] {
    return [...this.authorizations];
  }

  clear(): void {
    this.authorizations = [];
    try {
      localStorage.removeItem('tool_authorizations');
    } catch (e) {
      console.error('Failed to clear tool authorizations from storage', e);
    }
    this.emit();
  }

  isToolAuthorized(entiId: string, toolId: string): boolean {
    return isToolAuthorized(entiId, toolId as ToolId, this.authorizations);
  }
}

export const toolAuthorizationRepository = new InMemoryToolAuthorizationRepository();
