import { describe, it, expect } from 'vitest';
import type { DesktopBundleMetadata } from '../desktopBundleMetadata';

describe('desktopBundleMetadata', () => {
  it('should define a type for bundle metadata', () => {
    const metadata: DesktopBundleMetadata = {
      bundleIdentifier: 'com.entity.app',
      productName: 'Entity',
      version: '1.0.0',
      shortDescription: 'Entity AI Desktop',
      longDescription: 'Entity MVP Desktop Application',
      category: 'Utility',
      publisher: 'hnoloh',
      license: 'MIT'
    };
    expect(metadata.productName).toBe('Entity');
  });
});
