import type { LLMAutoInstallerState } from './llmAutoInstallerState';

export interface LLMInstallResult {
  state: LLMAutoInstallerState;
  success: boolean;
  message?: string;
  errorDetail?: string;
  absolutePath?: string;
}
