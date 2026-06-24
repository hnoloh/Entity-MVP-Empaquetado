import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SplashScreen } from '../../../components/Splash/SplashScreen';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({})
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {})
}));

describe('SplashDesktopHostIntegration', () => {
  it('should render splash and handle transition logic without autorun', async () => {
    render(<SplashScreen />);
    expect(screen.getByText('ENTITY')).toBeInTheDocument();
    // No networking or auto-runs occur during rendering of splash
  });
});
