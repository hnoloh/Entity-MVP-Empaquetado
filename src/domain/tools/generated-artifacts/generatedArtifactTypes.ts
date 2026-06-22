import type { ToolId } from '../toolTypes';

export type GeneratedArtifactId = string;
export type ArtifactMimeType = 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' | 'text/html';
export type ArtifactStatus = 'success' | 'failed' | 'pending';

export interface GeneratedToolArtifact {
  artifactId: GeneratedArtifactId;
  entiId: string;
  toolId: ToolId;
  mimeType: ArtifactMimeType | string;
  filename: string;
  size?: number;
  status: ArtifactStatus;
  blob?: Blob;
}
