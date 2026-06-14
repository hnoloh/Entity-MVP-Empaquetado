import { describe, it, expect, beforeEach } from "vitest";
import { createEntiFlow } from "../createEntiFlow";
import { entiRepository } from "../entiRepository";

describe("CreateEntiFlow", () => {
  beforeEach(() => {
    entiRepository.clear();
  });

  it("crea un Enti y lo guarda en el repositorio", () => {
    const enti = createEntiFlow();
    
    expect(enti).toBeDefined();
    expect(enti.type).toBe("enti");
    expect(enti.status).toBe("incomplete"); // no brain config
    
    const saved = entiRepository.getById(enti.id);
    expect(saved).toEqual(enti);
    
    const list = entiRepository.list();
    expect(list).toHaveLength(1);
  });

  it("múltiples llamadas crean entidades distintas", () => {
    const enti1 = createEntiFlow();
    const enti2 = createEntiFlow();
    
    expect(enti1.id).not.toBe(enti2.id);
    expect(entiRepository.list()).toHaveLength(2);
  });
});
