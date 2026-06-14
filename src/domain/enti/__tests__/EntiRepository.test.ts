import { describe, it, expect, beforeEach } from "vitest";
import { entiRepository, InMemoryEntiRepository } from "../entiRepository";
import { createEnti } from "../createEnti";
import type { EntiHarness } from "../Enti";

describe("EntiRepository", () => {
  const defaultHarness: EntiHarness = {
    function: "Test",
    rules: ["R1"],
    workMaterial: "W",
    knowledge: "K",
  };

  beforeEach(() => {
    entiRepository.clear();
  });

  it("save guarda un Enti válido y getById lo recupera", () => {
    const enti = createEnti("1", "Test Enti", defaultHarness);
    entiRepository.save(enti);

    const recovered = entiRepository.getById("1");
    expect(recovered).toBeDefined();
    expect(recovered?.id).toBe("1");
    expect(recovered?.name).toBe("Test Enti");
    expect(recovered?.status).toBe("incomplete"); // Enti sin Brain
  });

  it("getById devuelve null si no existe", () => {
    expect(entiRepository.getById("999")).toBeNull();
  });

  it("list devuelve todos los Entis guardados y solo Entis", () => {
    const enti1 = createEnti("1", "Enti 1", defaultHarness);
    const enti2 = createEnti("2", "Enti 2", defaultHarness);
    
    entiRepository.save(enti1);
    entiRepository.save(enti2);

    const list = entiRepository.list();
    expect(list).toHaveLength(2);
    expect(list.map(e => e.id)).toContain("1");
    expect(list.map(e => e.id)).toContain("2");
  });

  it("guardar dos veces sobrescribe de forma determinista", () => {
    const enti = createEnti("1", "Original", defaultHarness);
    entiRepository.save(enti);

    const entiUpdated = createEnti("1", "Updated", defaultHarness);
    entiRepository.save(entiUpdated);

    const list = entiRepository.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Updated");
  });

  it("delete elimina por id", () => {
    const enti = createEnti("1", "To Delete", defaultHarness);
    entiRepository.save(enti);
    
    entiRepository.delete("1");
    expect(entiRepository.getById("1")).toBeNull();
    expect(entiRepository.list()).toHaveLength(0);
  });

  it("datos corruptos o tipo no Enti son ignorados", () => {
    const repo = new InMemoryEntiRepository();
    const badData: Record<string, unknown> = { id: "bad", type: "not-enti", name: "bad" };
    
    // Forzamos inyección ignorando tipado para simular lectura de disco corrupta
    // @ts-expect-error simular escritura corrupta
    repo["store"].set("bad", badData);

    expect(repo.getById("bad")).toBeNull();
    expect(repo.list()).toHaveLength(0);
  });

  it("repositorio vacío devuelve lista vacía", () => {
    expect(entiRepository.list()).toEqual([]);
  });
});
