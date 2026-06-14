import { createEnti } from "./createEnti";
import { entiRepository } from "./entiRepository";
import type { Enti } from "./Enti";

let nextId = 1;

export function createEntiFlow(): Enti {
  const id = `enti-${Date.now()}-${nextId++}`;
  
  const enti = createEnti(id, `Nuevo Enti ${nextId - 1}`, {
    function: "",
    rules: [],
    workMaterial: "",
    knowledge: ""
  });
  
  entiRepository.save(enti);
  return enti;
}
