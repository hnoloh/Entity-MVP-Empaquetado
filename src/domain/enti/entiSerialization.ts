import type { Enti, EntiHarness, EntiCognitiveConfig } from "./Enti";
import { deriveEntiStatus } from "./entiStatus";

export interface SerializedEnti {
  id: string;
  type: "enti";
  name: string;
  harness: EntiHarness;
  cognitiveConfig: EntiCognitiveConfig;
}

export function serializeEnti(enti: Enti): SerializedEnti {
  return {
    id: enti.id,
    type: enti.type,
    name: enti.name,
    harness: enti.harness,
    cognitiveConfig: enti.cognitiveConfig,
  };
}

export function deserializeEnti(data: SerializedEnti): Enti {
  if (data.type !== "enti") {
    throw new Error("Invalid Enti type");
  }

  const enti: Enti = {
    id: data.id,
    type: data.type,
    name: data.name,
    harness: data.harness,
    cognitiveConfig: data.cognitiveConfig,
    status: "incomplete",
  };
  enti.status = deriveEntiStatus(data);
  return enti;
}
