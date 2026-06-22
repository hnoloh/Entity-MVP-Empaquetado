import { htmlGenerationToolExecutor } from '../htmlGenerationToolExecutor';
import type { HtmlGenerationInput } from '../htmlGenerationTypes';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toolIndicatorRepository } from '../../toolIndicatorRepository';
import { generatedArtifactRegistry } from '../../generated-artifacts';
import * as policyModule from '../htmlGenerationPolicy';

vi.mock('../../toolIndicatorRepository', () => ({
  toolIndicatorRepository: {
    setIndicator: vi.fn()
  }
}));

vi.mock('../../generated-artifacts', () => ({
  generatedArtifactRegistry: {
    registerArtifact: vi.fn()
  }
}));

vi.mock('../htmlGenerationPolicy', () => ({
  htmlGenerationPolicy: vi.fn()
}));

describe('HtmlGenerationToolExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validInput: HtmlGenerationInput = {
    entiId: 'enti-123',
    toolId: 'html-generation',
    filename: 'index.html',
    htmlContent: '<html>Hello</html>'
  };

  it('registers artifact and returns success if policy passes', async () => {
    vi.mocked(policyModule.htmlGenerationPolicy).mockReturnValue({ allowed: true });
    
    const result = await htmlGenerationToolExecutor.execute(validInput);
    
    expect(result.status).toBe('success');
    expect(result.artifactId).toBeDefined();
    expect(toolIndicatorRepository.setIndicator).toHaveBeenCalledWith('enti-123', 'html-generation', 'in_use');
    expect(toolIndicatorRepository.setIndicator).toHaveBeenCalledWith('enti-123', 'html-generation', 'active');
    expect(generatedArtifactRegistry.registerArtifact).toHaveBeenCalled();
  });

  it('returns blocked and sets blocked indicator if policy fails', async () => {
    vi.mocked(policyModule.htmlGenerationPolicy).mockReturnValue({ allowed: false, reason: 'invalid' });
    
    const result = await htmlGenerationToolExecutor.execute(validInput);
    
    expect(result.status).toBe('blocked');
    expect(result.reason).toBe('invalid');
    expect(toolIndicatorRepository.setIndicator).toHaveBeenCalledWith('enti-123', 'html-generation', 'in_use');
    expect(toolIndicatorRepository.setIndicator).toHaveBeenCalledWith('enti-123', 'html-generation', 'blocked');
    expect(generatedArtifactRegistry.registerArtifact).not.toHaveBeenCalled();
  });

  it('returns controlled_error if generation throws', async () => {
    vi.mocked(policyModule.htmlGenerationPolicy).mockImplementation(() => {
      throw new Error('Unexpected crash');
    });
    
    const result = await htmlGenerationToolExecutor.execute(validInput);
    
    expect(result.status).toBe('controlled_error');
    expect(result.error).toBe('Unexpected crash');
    expect(toolIndicatorRepository.setIndicator).toHaveBeenCalledWith('enti-123', 'html-generation', 'controlled_error');
  });
});
