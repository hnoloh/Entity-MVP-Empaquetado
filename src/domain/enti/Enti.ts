export type EntiId = string;

export type EntiCognitiveMode = "unconfigured" | "local" | "cloud";

export interface EntiCognitiveConfig {
  mode: EntiCognitiveMode;
  provider?: string;
  model?: string;
  apiKey?: string;
}

export interface EntiHarness {
  function: string;
  shortFunction?: string;
  rules: string[];
  workMaterial: string;
  knowledge: string;
}

export type EntiStatus = "complete" | "incomplete";

export interface Enti {
  id: EntiId;
  type: "enti";
  name: string;
  harness: EntiHarness;
  cognitiveConfig: EntiCognitiveConfig;
  status: EntiStatus;
}
