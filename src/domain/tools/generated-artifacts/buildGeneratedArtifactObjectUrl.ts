import type { GeneratedToolArtifact } from './generatedArtifactTypes';

export function buildGeneratedArtifactObjectUrl(artifact: GeneratedToolArtifact): { url: string; revoke: () => void } {
  if (!artifact.blob) {
    throw new Error('Artifact has no binary content');
  }
  const url = URL.createObjectURL(artifact.blob);
  return {
    url,
    revoke: () => URL.revokeObjectURL(url)
  };
}
