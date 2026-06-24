import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SplashScreen } from '../SplashScreen';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({})
}));

describe('SplashScreen Component', () => {
  it('renders ghost and title', () => {
    render(<SplashScreen />);
    expect(screen.getByText('ENTITY')).toBeInTheDocument();
  });
});
