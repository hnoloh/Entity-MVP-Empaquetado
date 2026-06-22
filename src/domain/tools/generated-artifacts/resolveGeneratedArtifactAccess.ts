import type { GeneratedArtifactId } from './generatedArtifactTypes';
import type { GeneratedArtifactDownloadDescriptor, GeneratedArtifactOpenDescriptor } from './generatedArtifactAccessTypes';
import { GeneratedArtifactAccessPolicy } from './generatedArtifactAccessPolicy';
import { buildGeneratedArtifactObjectUrl } from './buildGeneratedArtifactObjectUrl';

export class GeneratedArtifactAccessResolver {
  constructor(private policy = new GeneratedArtifactAccessPolicy()) {}

  resolveDownload(artifactId: GeneratedArtifactId, entiId: string): GeneratedArtifactDownloadDescriptor {
    const { allowed, reason, artifact } = this.policy.canAccess(artifactId, entiId);
    if (!allowed || !artifact) {
      throw new Error(`Access denied: ${reason}`);
    }

    const extension = artifact.filename.split('.').pop() || '';

    return {
      artifactId: artifact.artifactId,
      filename: artifact.filename,
      mimeType: artifact.mimeType,
      extension: `.${extension}`,
      size: artifact.size,
      owner: artifact.entiId,
      isDownloadable: true
    };
  }

  resolveOpen(artifactId: GeneratedArtifactId, entiId: string): { descriptor: GeneratedArtifactOpenDescriptor; revoke: () => void } {
    const { allowed, reason, artifact } = this.policy.canAccess(artifactId, entiId);
    if (!allowed || !artifact) {
      throw new Error(`Access denied: ${reason}`);
    }

    const { url, revoke } = buildGeneratedArtifactObjectUrl(artifact);

    return {
      descriptor: {
        artifactId: artifact.artifactId,
        objectUrl: url,
        mimeType: artifact.mimeType
      },
      revoke
    };
  }
}

export const generatedArtifactAccessResolver = new GeneratedArtifactAccessResolver();
