import { describe, it, expect } from 'vitest';
import { validateLaunchShortcutPolicy } from '../desktopLaunchShortcutPolicy';

describe('desktopLaunchShortcutPolicy', () => {
  it('should validate policy correctly', () => {
    expect(validateLaunchShortcutPolicy({
      createsDesktopShortcut: true,
      createsStartMenuShortcut: false,
      execName: 'entity'
    })).toBe(true);

    expect(validateLaunchShortcutPolicy({
      createsDesktopShortcut: false,
      createsStartMenuShortcut: false,
      execName: 'entity'
    })).toBe(false);

    expect(validateLaunchShortcutPolicy({
      createsDesktopShortcut: true,
      createsStartMenuShortcut: true,
      execName: ''
    })).toBe(false);
  });
});
