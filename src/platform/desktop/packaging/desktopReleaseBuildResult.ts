import type { DesktopInstallableArtifact } from './desktopInstallableArtifact';
import type { DesktopBundleMetadata } from './desktopBundleMetadata';
import type { DesktopAppIconPolicy } from './desktopAppIconPolicy';
import type { DesktopLaunchShortcutPolicy } from './desktopLaunchShortcutPolicy';

export interface DesktopReleaseBuildResult {
  success: boolean;
  artifacts: DesktopInstallableArtifact[];
  metadata: DesktopBundleMetadata;
  iconPolicy: DesktopAppIconPolicy;
  launchPolicy: DesktopLaunchShortcutPolicy;
  buildTimeMs: number;
  errors: string[];
}
