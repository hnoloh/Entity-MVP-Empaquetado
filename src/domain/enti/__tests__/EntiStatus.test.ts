import { describe, it, expect } from "vitest";
import { deriveEntiStatus } from "../entiStatus";
import type { Enti } from "../Enti";

describe("deriveEntiStatus", () => {
  it("TEST-FIA022-01: Enti sin Nombre muestra Incompleto", () => {
    const noName = {
      name: "",
      cognitiveConfig: { mode: "local", provider: "p", model: "m" }
    } as Omit<Enti, "status">;
    expect(deriveEntiStatus(noName)).toBe("incomplete");

    const noNameSpaces = {
      name: "   ",
      cognitiveConfig: { mode: "local", provider: "p", model: "m" }
    } as Omit<Enti, "status">;
    expect(deriveEntiStatus(noNameSpaces)).toBe("incomplete");
  });

  it("TEST-FIA022-02: Enti con Nombre pero sin Brain válido muestra Incompleto", () => {
    const noBrainConfig = {
      name: "Valid Name",
      cognitiveConfig: { mode: "unconfigured" }
    } as Omit<Enti, "status">;
    expect(deriveEntiStatus(noBrainConfig)).toBe("incomplete");
  });

  it("TEST-FIA022-03: IA Local sin provider/model muestra Incompleto", () => {
    const partialLocal = {
      name: "Valid Name",
      cognitiveConfig: { mode: "local", provider: "p" }
    } as Omit<Enti, "status">;
    expect(deriveEntiStatus(partialLocal)).toBe("incomplete");

    const missingBothLocal = {
      name: "Valid Name",
      cognitiveConfig: { mode: "local" }
    } as Omit<Enti, "status">;
    expect(deriveEntiStatus(missingBothLocal)).toBe("incomplete");
  });

  it("TEST-FIA022-04: IA Cloud/OpenAI sin apiKey muestra Incompleto", () => {
    const partialCloud = {
      name: "Valid Name",
      cognitiveConfig: { mode: "cloud" }
    } as Omit<Enti, "status">;
    expect(deriveEntiStatus(partialCloud)).toBe("incomplete");

    const emptyApiKeyCloud = {
      name: "Valid Name",
      cognitiveConfig: { mode: "cloud", apiKey: "" }
    } as Omit<Enti, "status">;
    expect(deriveEntiStatus(emptyApiKeyCloud)).toBe("incomplete");
  });

  it("TEST-FIA022-13: Negativos: no Función obligatoria", () => {
    const enti: Enti = {
      id: "1",
      type: "enti",
      name: "Test",
      status: "incomplete",
      harness: { function: "", rules: [], knowledge: "", workMaterial: "" }, // Función vacía
      cognitiveConfig: { mode: "local", provider: "ollama", model: "llama3" }
    };
    expect(deriveEntiStatus(enti)).toBe("complete");
  });
});
