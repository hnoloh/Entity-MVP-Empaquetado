export interface DesktopInstallableArtifact {
  id: string;
  name: string;
  version: string;
  targetPlatform: string;
  architecture: string;
  bundleFormat: string; // e.g., 'deb', 'appimage', 'msi'
  artifactPath: string;
}
