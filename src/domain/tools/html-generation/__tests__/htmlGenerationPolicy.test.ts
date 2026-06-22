import { htmlGenerationPolicy } from '../htmlGenerationPolicy';
import type { HtmlGenerationInput } from '../htmlGenerationTypes';
import { toolAuthorizationRepository } from '../../toolAuthorizationRepository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../toolAuthorizationRepository', () => ({
  toolAuthorizationRepository: {
    isToolAuthorized: vi.fn(),
  },
}));

describe('htmlGenerationPolicy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validInput: HtmlGenerationInput = {
    entiId: 'enti-123',
    toolId: 'html-generation',
    filename: 'index.html',
    htmlContent: '<html><body>Hello</body></html>',
  };

  it('permits Enti authorized with index.html and self-contained content', () => {
    vi.mocked(toolAuthorizationRepository.isToolAuthorized).mockReturnValue(true);
    const result = htmlGenerationPolicy(validInput);
    expect(result).toEqual({ allowed: true });
  });

  it('blocks Enti without active tool', () => {
    vi.mocked(toolAuthorizationRepository.isToolAuthorized).mockReturnValue(false);
    const result = htmlGenerationPolicy(validInput);
    expect(result).toEqual({ allowed: false, reason: 'tool_not_authorized' });
  });

  it('blocks owner Grupo', () => {
    vi.mocked(toolAuthorizationRepository.isToolAuthorized).mockReturnValue(true);
    const result = htmlGenerationPolicy({ ...validInput, entiId: 'group' });
    expect(result).toEqual({ allowed: false, reason: 'owner_group_not_allowed' });
  });

  it('blocks path traversal and absolute paths', () => {
    vi.mocked(toolAuthorizationRepository.isToolAuthorized).mockReturnValue(true);
    expect(htmlGenerationPolicy({ ...validInput, filename: '../index.html' })).toEqual({ allowed: false, reason: 'path_traversal' });
    expect(htmlGenerationPolicy({ ...validInput, filename: '/index.html' })).toEqual({ allowed: false, reason: 'absolute_path_not_allowed' });
  });

  it('blocks false extension or non-html extension', () => {
    vi.mocked(toolAuthorizationRepository.isToolAuthorized).mockReturnValue(true);
    expect(htmlGenerationPolicy({ ...validInput, filename: 'index.html.exe' })).toEqual({ allowed: false, reason: 'extension_not_allowed' });
    expect(htmlGenerationPolicy({ ...validInput, filename: 'index.txt' })).toEqual({ allowed: false, reason: 'extension_not_allowed' });
  });

  it('allows empty content', () => {
    vi.mocked(toolAuthorizationRepository.isToolAuthorized).mockReturnValue(true);
    expect(htmlGenerationPolicy({ ...validInput, htmlContent: '' })).toEqual({ allowed: true });
    expect(htmlGenerationPolicy({ ...validInput, htmlContent: '   ' })).toEqual({ allowed: true });
  });

  it('blocks remote resources, CDNs, network fetch', () => {
    vi.mocked(toolAuthorizationRepository.isToolAuthorized).mockReturnValue(true);
    expect(htmlGenerationPolicy({ ...validInput, htmlContent: '<script src="https://cdn.example.com/script.js"></script>' })).toEqual({ allowed: false, reason: 'remote_resources_not_allowed' });
    expect(htmlGenerationPolicy({ ...validInput, htmlContent: '<link href="http://example.com/style.css" />' })).toEqual({ allowed: false, reason: 'remote_resources_not_allowed' });
    expect(htmlGenerationPolicy({ ...validInput, htmlContent: '<img src="https://example.com/image.png" />' })).toEqual({ allowed: false, reason: 'remote_resources_not_allowed' });
    expect(htmlGenerationPolicy({ ...validInput, htmlContent: 'fetch("https://api.example.com")' })).toEqual({ allowed: false, reason: 'remote_resources_not_allowed' });
  });
});
