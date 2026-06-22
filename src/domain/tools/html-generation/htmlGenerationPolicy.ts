import type { HtmlGenerationInput, HtmlGenerationPolicyResult } from './htmlGenerationTypes';
import { toolAuthorizationRepository } from '../toolAuthorizationRepository';

const REMOTE_RESOURCE_PATTERNS = [
  /src\s*=\s*['"](http|https|\/\/)/i,
  /href\s*=\s*['"](http|https|\/\/)/i,
  /url\s*\(\s*['"]?(http|https|\/\/)/i,
  /fetch\s*\(/i,
  /XMLHttpRequest/i,
  /import\s+.*from\s+['"](http|https|\/\/)/i
];

export function htmlGenerationPolicy(input: HtmlGenerationInput): HtmlGenerationPolicyResult {
  // Validate owner Enti
  if (input.entiId === 'group') {
    return { allowed: false, reason: 'owner_group_not_allowed' };
  }

  // Validate tool authorization
  if (!toolAuthorizationRepository.isToolAuthorized(input.entiId, input.toolId)) {
    return { allowed: false, reason: 'tool_not_authorized' };
  }

  // Validate filename extension
  if (!input.filename.toLowerCase().endsWith('.html') || input.filename.toLowerCase().endsWith('.html.exe')) {
    return { allowed: false, reason: 'extension_not_allowed' };
  }

  // Validate path traversal / absolute paths
  if (input.filename.includes('..')) {
    return { allowed: false, reason: 'path_traversal' };
  }
  if (input.filename.startsWith('/') || input.filename.includes(':\\')) {
    return { allowed: false, reason: 'absolute_path_not_allowed' };
  }

  // Validate content (empty content is now allowed per user request overriding SPEC)
  if (!input.htmlContent) {
    // If undefined or null, we just assume empty string
    input.htmlContent = '';
  }

  // Block remote resources
  for (const pattern of REMOTE_RESOURCE_PATTERNS) {
    if (pattern.test(input.htmlContent)) {
      return { allowed: false, reason: 'remote_resources_not_allowed' };
    }
  }

  return { allowed: true };
}
