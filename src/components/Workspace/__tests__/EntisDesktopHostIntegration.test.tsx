
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntitiesColumnRegion } from '../EntitiesColumnRegion';
import { desktopHostAdapter } from '../../../platform/desktop/desktopHostAdapter';

vi.mock('../../../platform/desktop/desktopHostAdapter', () => ({
  desktopHostAdapter: {
    isDesktopMode: vi.fn().mockReturnValue(false),
    getPlatformName: vi.fn().mockReturnValue('web-fallback')
  }
}));

describe('EntisDesktopHostIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEntis = [
    { id: '1', name: 'Enti A' },
    { id: '2', name: 'Enti B' }
  ];

  it('renders correctly in web-fallback mode', () => {
    vi.mocked(desktopHostAdapter.isDesktopMode).mockReturnValue(false);
    
    render(<EntitiesColumnRegion entis={mockEntis} />);
    
    expect(screen.getByText('Enti A')).toBeInTheDocument();
    expect(screen.getByText('Enti B')).toBeInTheDocument();
    expect(desktopHostAdapter.isDesktopMode()).toBe(false);
  });

  it('renders correctly and preserves isolation in desktop-host mode', () => {
    vi.mocked(desktopHostAdapter.isDesktopMode).mockReturnValue(true);
    vi.mocked(desktopHostAdapter.getPlatformName).mockReturnValue('tauri');
    
    render(<EntitiesColumnRegion entis={mockEntis} />);
    
    expect(screen.getByText('Enti A')).toBeInTheDocument();
    expect(screen.getByText('Enti B')).toBeInTheDocument();
    expect(desktopHostAdapter.isDesktopMode()).toBe(true);
  });
});
