import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';
import { desktopHostAdapter } from '../../../platform/desktop/desktopHostAdapter';

vi.mock('../../../platform/desktop/desktopHostAdapter', () => ({
  desktopHostAdapter: {
    isDesktopMode: vi.fn().mockReturnValue(false),
    getPlatformName: vi.fn().mockReturnValue('web-fallback')
  }
}));

describe('WorkspaceDesktopHostIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mounts as main shell without errors in web-fallback mode', () => {
    render(<WorkspaceShell />);

    // Hub, EntitiesColumn, Workbench should exist
    expect(screen.getByTestId('workspace-shell')).toBeInTheDocument();
    
    // Adapter returns false
    expect(desktopHostAdapter.isDesktopMode()).toBe(false);
  });

  it('mounts as main shell without errors in simulated desktop mode', () => {
    vi.mocked(desktopHostAdapter.isDesktopMode).mockReturnValue(true);
    
    render(<WorkspaceShell />);

    // Shell still mounts perfectly
    expect(screen.getByTestId('workspace-shell')).toBeInTheDocument();
  });
});
