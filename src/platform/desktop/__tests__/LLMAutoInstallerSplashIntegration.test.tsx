import { render, screen } from '@testing-library/react';
import { SplashScreen } from '../../../components/Splash/SplashScreen';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn()
}));

describe('LLMAutoInstallerSplashIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and sets up listen and invoke', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (listen as any).mockResolvedValue(vi.fn());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (invoke as any).mockResolvedValue({ success: true, state: 'ready' });

    render(<SplashScreen />);

    // Wait for the async logic to execute
    await screen.findByText(/Todo listo. Iniciando Entity/i);
    
    expect(listen).toHaveBeenCalledWith('llm-download-progress', expect.any(Function));
    expect(invoke).toHaveBeenCalledWith('install_starter_model');
  });
});
