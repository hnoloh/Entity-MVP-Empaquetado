import type { Enti, EntiStatus } from "./Enti";

export function deriveEntiStatus(enti: Omit<Enti, "status">): EntiStatus {
  if (!enti.name || enti.name.trim() === "") {
    return "incomplete";
  }
  const config = enti.cognitiveConfig;
  if (config.mode === "unconfigured") {
    return "incomplete";
  }
  if (config.mode === "local" && (!config.provider || !config.model)) {
    return "incomplete";
  }
  if (config.mode === "cloud" && !config.apiKey) {
    return "incomplete";
  }
  return "complete";
}
