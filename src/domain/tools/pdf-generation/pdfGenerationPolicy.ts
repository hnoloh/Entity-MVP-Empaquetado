import type { ToolAuthorizationRepository } from '../toolAuthorizationRepository';
import type { PdfGenerationInput } from './pdfGenerationTypes';
import { toolAuthorizationRepository } from '../toolAuthorizationRepository';

export class PdfGenerationPolicy {
  constructor(private authRepo: ToolAuthorizationRepository = toolAuthorizationRepository) {}

  validate(input: PdfGenerationInput): { allowed: boolean; reason?: string } {
    if (!input.entiId) {
      return { allowed: false, reason: 'invalid_owner' };
    }
    if (input.entiId.startsWith('group')) {
      return { allowed: false, reason: 'group_owner_not_allowed' };
    }
    
    const isAuthorized = this.authRepo.isToolAuthorized(input.entiId, input.toolId);
    if (!isAuthorized) {
      return { allowed: false, reason: 'tool_not_authorized' };
    }

    if (!input.content) {
      input.content = '';
    }

    if (input.filename.includes('../') || input.filename.includes('/')) {
      return { allowed: false, reason: 'path_traversal' };
    }

    if (!input.filename.endsWith('.pdf')) {
      return { allowed: false, reason: 'invalid_extension' };
    }

    return { allowed: true };
  }
}
