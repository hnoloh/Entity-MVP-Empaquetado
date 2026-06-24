import { describe, it, expect } from 'vitest';
import { validateAppIconPolicy } from '../desktopAppIconPolicy';

describe('desktopAppIconPolicy', () => {
  it('should validate policy with icon', () => {
    expect(validateAppIconPolicy({
      hasOfficialIcon: true,
      iconPaths: { png32: 'icon.png' },
      sourceImage: 'Ghost.jpeg'
    })).toBe(true);
  });

  it('should fail if no icon', () => {
    expect(validateAppIconPolicy({
      hasOfficialIcon: false,
      iconPaths: { png32: 'icon.png' },
      sourceImage: 'Ghost.jpeg'
    })).toBe(false);
  });
});
