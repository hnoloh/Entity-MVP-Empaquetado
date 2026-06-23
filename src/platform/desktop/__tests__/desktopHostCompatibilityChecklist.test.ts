import { describe, it, expect } from 'vitest';
import { desktopHostCompatibilityChecklist } from '../desktopHostCompatibilityChecklist';

describe('DesktopHostCompatibilityChecklist', () => {
  it('contains all required categories for desktop transition', () => {
    const categories = new Set(desktopHostCompatibilityChecklist.map(item => item.category));
    expect(categories.has('routes')).toBe(true);
    expect(categories.has('assets')).toBe(true);
    expect(categories.has('storage')).toBe(true);
    expect(categories.has('object_urls')).toBe(true);
    expect(categories.has('web_apis')).toBe(true);
  });

  it('all items start in pending status by default before framework selection', () => {
    const allPending = desktopHostCompatibilityChecklist.every(item => item.status === 'pending');
    expect(allPending).toBe(true);
  });
});
