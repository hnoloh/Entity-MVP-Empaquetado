import { describe, it, expect } from 'vitest';
import { executeEntiFlow } from '../executeEntiFlow';
import type { ProviderBridge } from '../provider/ProviderBridge';

describe('RuntimeDesktopHostIntegration', () => {
  it('should block execution if not explicit user action', async () => {
    const res = await executeEntiFlow(
      { entiId: 'e1', chatId: 'c1', explicitUserAction: false, targetType: 'ENTI' },
      null,
      null,
      undefined
    );
    expect(res.status).toBe('blocked');
    expect(res.error).toContain('explicit user action');
  });

  it('should return controlled_error when enti is missing but provider is present', async () => {
    const mockProvider = {
      execute: async () => ({ success: true, responseText: 'Success' })
    };
    const res = await executeEntiFlow(
      { entiId: 'e1', chatId: 'c1', explicitUserAction: true, targetType: 'ENTI' },
      null,
      null,
      mockProvider as unknown as ProviderBridge
    );
    expect(res.status).toBe('controlled_error');
  });
});
