import { describe, it, expect } from "vitest";
import { createEnti } from "../createEnti";
import { deriveEntiStatus } from "../entiStatus";
import { serializeEnti, deserializeEnti } from "../entiSerialization";
import type { SerializedEnti } from "../entiSerialization";
import type { EntiHarness, Enti } from "../Enti";

describe("Enti Domain Model", () => {
  const defaultHarness: EntiHarness = {
    function: "Test function",
    rules: ["Rule 1"],
    workMaterial: "Test material",
    knowledge: "Test knowledge",
  };

  it("creates an incomplete Enti without Brain", () => {
    const enti = createEnti("1", "Test Enti", defaultHarness);

    expect(enti.id).toBe("1");
    expect(enti.type).toBe("enti");
    expect(enti.name).toBe("Test Enti");
    expect(enti.harness).toEqual(defaultHarness);
    expect(enti.cognitiveConfig.mode).toBe("unconfigured");
    expect(enti.status).toBe("incomplete");
  });

  it("creates a complete Enti when Brain is properly configured", () => {
    const enti = createEnti("2", "Smart Enti", defaultHarness, {
      mode: "local",
      provider: "ollama",
      model: "llama3",
    });

    expect(enti.cognitiveConfig.mode).toBe("local");
    expect(enti.status).toBe("complete");
  });

  it("derives status correctly based on cognitive config and name", () => {
    const base = { name: "Test Name", harness: { function: "Do it" } } as Omit<Enti, "status">;
    expect(deriveEntiStatus({ ...base, cognitiveConfig: { mode: "unconfigured" } })).toBe("incomplete");
    expect(deriveEntiStatus({ ...base, cognitiveConfig: { mode: "local", provider: "ollama" } })).toBe("incomplete");
    expect(deriveEntiStatus({ ...base, cognitiveConfig: { mode: "local", provider: "ollama", model: "llama3" } })).toBe("complete");
    expect(deriveEntiStatus({ ...base, cognitiveConfig: { mode: "cloud", provider: "openai", model: "gpt-4" } })).toBe("incomplete"); // cloud needs apiKey
    expect(deriveEntiStatus({ ...base, cognitiveConfig: { mode: "cloud", apiKey: "sk-123" } })).toBe("complete");
    expect(deriveEntiStatus({ name: "", harness: { function: "Do it" }, cognitiveConfig: { mode: "cloud", apiKey: "sk-123" } } as Omit<Enti, "status">)).toBe("incomplete");
  });

  it("serializes and deserializes conceptually without visual state", () => {
    const enti = createEnti("3", "Serializable Enti", defaultHarness, {
      mode: "cloud",
      provider: "openai",
      model: "gpt-4",
      apiKey: "sk-123",
    });

    const serialized = serializeEnti(enti);
    expect(serialized).not.toHaveProperty("status");

    const deserialized = deserializeEnti(serialized);
    expect(deserialized.id).toBe("3");
    expect(deserialized.status).toBe("complete");
    expect(deserialized).toEqual(enti);
  });

  it("rejects invalid types during deserialization", () => {
    const invalidData: Record<string, unknown> = {
      id: "4",
      type: "not-enti",
      name: "Bad",
      harness: defaultHarness,
      cognitiveConfig: { mode: "unconfigured" },
    };

    expect(() => deserializeEnti(invalidData as unknown as SerializedEnti)).toThrow("Invalid Enti type");
  });

  it("allows multiple Entis with different configurations", () => {
    const enti1 = createEnti("1", "Local Enti", defaultHarness, { mode: "local", provider: "x", model: "y" });
    const enti2 = createEnti("2", "Cloud Enti", defaultHarness, { mode: "cloud", provider: "z", model: "w" });

    expect(enti1.cognitiveConfig.mode).toBe("local");
    expect(enti2.cognitiveConfig.mode).toBe("cloud");
  });
});
