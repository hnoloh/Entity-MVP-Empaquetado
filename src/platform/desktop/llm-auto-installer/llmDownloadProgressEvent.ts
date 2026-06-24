import type { LLMAutoInstallerState } from './llmAutoInstallerState';

export interface LLMDownloadProgressEvent {
  state: LLMAutoInstallerState;
  progress: number;
  downloadedBytes?: number;
  totalBytes?: number;
  message?: string;
}
