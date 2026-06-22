import type { GeneratedArtifactId } from './generatedArtifactTypes';

export interface GeneratedArtifactDownloadDescriptor {
  artifactId: GeneratedArtifactId;
  filename: string;
  mimeType: string;
  extension: string;
  size?: number;
  owner: string;
  isDownloadable: boolean;
}

export interface GeneratedArtifactOpenDescriptor {
  artifactId: GeneratedArtifactId;
  objectUrl: string;
  mimeType: string;
}
