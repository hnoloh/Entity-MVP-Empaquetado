import { describe, it, expect } from 'vitest';
import type { DesktopReleaseBuildResult } from '../desktopReleaseBuildResult';

describe('desktopReleaseBuildResult', () => {
  it('should define a result correctly', () => {
    const result: DesktopReleaseBuildResult = {
      success: true,
      artifacts: [],
      metadata: { bundleIdentifier: 'com.entity.app', productName: 'Entity', version: '1.0', shortDescription: '', longDescription: '', category: '', publisher: '', license: '' },
      iconPolicy: { hasOfficialIcon: true, iconPaths: {}, sourceImage: 'Ghost.jpeg' },
      launchPolicy: { createsDesktopShortcut: true, createsStartMenuShortcut: true, execName: 'entity' },
      buildTimeMs: 1000,
      errors: []
    };
    expect(result.success).toBe(true);
  });
});
