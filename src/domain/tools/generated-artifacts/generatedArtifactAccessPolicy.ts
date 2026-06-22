import { generatedArtifactRegistry } from './generatedArtifactRegistry';
import type { GeneratedArtifactId, GeneratedToolArtifact } from './generatedArtifactTypes';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/html'
];

export class GeneratedArtifactAccessPolicy {
  constructor(private registry = generatedArtifactRegistry) {}

  canAccess(artifactId: GeneratedArtifactId, requestingEntiId: string): { allowed: boolean; reason?: string; artifact?: GeneratedToolArtifact } {
    const artifact = this.registry.getArtifactById(artifactId);
    if (!artifact) {
      return { allowed: false, reason: 'artifact_not_found' };
    }

    if (artifact.entiId !== requestingEntiId) {
      return { allowed: false, reason: 'unauthorized_owner' };
    }

    if (!ALLOWED_MIME_TYPES.includes(artifact.mimeType)) {
      return { allowed: false, reason: 'unsupported_mime_type' };
    }

    if (artifact.status !== 'success') {
      return { allowed: false, reason: 'artifact_not_ready' };
    }

    return { allowed: true, artifact };
  }
}
