import type { Enti } from "./Enti";
import { serializeEnti, deserializeEnti } from "./entiSerialization";
import type { SerializedEnti } from "./entiSerialization";

export interface EntiRepository {
  save(enti: Enti): void;
  saveSilent(enti: Enti): void;
  getById(id: string): Enti | null;
  list(): Enti[];
  delete(id: string): void;
  clear(): void;
}

export class InMemoryEntiRepository implements EntiRepository {
  private store: Map<string, SerializedEnti> = new Map();

  save(enti: Enti): void {
    const serialized = serializeEnti(enti);
    this.store.set(enti.id, serialized);
  }

  saveSilent(enti: Enti): void {
    const serialized = serializeEnti(enti);
    this.store.set(enti.id, serialized);
  }

  getById(id: string): Enti | null {
    const serialized = this.store.get(id);
    if (!serialized) return null;
    
    try {
      return deserializeEnti(serialized);
    } catch {
      // Ignorar controladamente datos corruptos o tipos no Enti
      return null;
    }
  }

  list(): Enti[] {
    const entis: Enti[] = [];
    for (const serialized of this.store.values()) {
      try {
        const enti = deserializeEnti(serialized);
        if (enti.type === "enti") {
          entis.push(enti);
        }
      } catch {
        // Ignorar
      }
    }
    return entis;
  }

  delete(id: string): void {
    this.store.delete(id);
  }

  clear(): void {
    this.store.clear();
  }
}

// Instancia singleton por defecto para la ejecución actual (adaptador en memoria)
export const entiRepository = new InMemoryEntiRepository();
