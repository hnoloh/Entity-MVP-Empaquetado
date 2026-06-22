import type { GeneratedToolArtifact, GeneratedArtifactId } from './generatedArtifactTypes';

export interface GeneratedArtifactRegistry {
  registerArtifact(artifact: GeneratedToolArtifact): void;
  getArtifactsByEnti(entiId: string): GeneratedToolArtifact[];
  getArtifactById(artifactId: GeneratedArtifactId): GeneratedToolArtifact | undefined;
}

export class InMemoryGeneratedArtifactRegistry implements GeneratedArtifactRegistry {
  private artifacts: Map<GeneratedArtifactId, GeneratedToolArtifact> = new Map();

  registerArtifact(artifact: GeneratedToolArtifact): void {
    if (!artifact.entiId) {
      throw new Error('entiId is required to register an artifact');
    }
    this.artifacts.set(artifact.artifactId, artifact);
  }

  getArtifactsByEnti(entiId: string): GeneratedToolArtifact[] {
    return Array.from(this.artifacts.values()).filter(a => a.entiId === entiId);
  }

  getArtifactById(artifactId: GeneratedArtifactId): GeneratedToolArtifact | undefined {
    return this.artifacts.get(artifactId);
  }
}

export const generatedArtifactRegistry = new InMemoryGeneratedArtifactRegistry();
