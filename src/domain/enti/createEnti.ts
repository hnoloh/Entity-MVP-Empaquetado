import type { Enti, EntiHarness, EntiCognitiveConfig } from "./Enti";
import { deriveEntiStatus } from "./entiStatus";

export function createEnti(
  id: string,
  name: string,
  harness: EntiHarness,
  cognitiveConfig: EntiCognitiveConfig = { mode: "unconfigured" }
): Enti {
  const enti: Enti = {
    id,
    type: "enti",
    name,
    harness,
    cognitiveConfig,
    status: "incomplete",
  };
  enti.status = deriveEntiStatus(enti);
  return enti;
}
