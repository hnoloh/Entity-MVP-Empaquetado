/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Attachment } from './attachmentModel';
import type { ResolveContextualSourcesResult } from './contextualSourceTypes';
import { buildEntiContextualSources } from './buildEntiContextualSources';
import { attachmentContentRepository } from './attachmentContentRepository';

export interface ResolveEntiContextualSourcesRequest {
  ownerId: string;
  attachments: Attachment[];
}

export function resolveEntiContextualSources(request: ResolveEntiContextualSourcesRequest): ResolveContextualSourcesResult {
  if (!request.ownerId || request.ownerId.trim() === '') {
    return { status: 'blocked', reason: 'ownerId is required' };
  }

  try {
    const sources = buildEntiContextualSources(request.ownerId, request.attachments);
    
    // FETCH Harness attachments directly from the repository!
    const repoResult = attachmentContentRepository.listByOwner('enti', request.ownerId);
    if (repoResult.status === 'success' && (repoResult as any).entries) {
       for (const entry of (repoResult as any).entries) {
          if (entry.scope === 'enti_knowledge' || entry.scope === 'enti_work_material') {
             // Avoid duplicates if somehow it was already added
             if (!sources.some(s => s.attachmentId === entry.attachmentId)) {
                sources.push({
                   attachmentId: entry.attachmentId,
                   ownerType: entry.ownerType,
                   ownerId: entry.ownerId,
                   scope: entry.scope as 'enti_knowledge' | 'enti_work_material'
                });
             }
          }
       }
    }
    
    return { status: 'success', sources };
  } catch (error) {
    return { status: 'controlled_error', reason: error instanceof Error ? error.message : 'Unknown error' };
  }
}
