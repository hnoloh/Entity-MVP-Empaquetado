import type { ContextualSourceDescriptor } from '../../attachments/contextualSourceTypes';
import { attachmentContentRepository } from '../../attachments/attachmentContentRepository';
import { entiPromptContextualSourcesPolicy } from './entiPromptContextualSourcesPolicy';
import type { 
  EntiPromptContextualSourceBlockResult, 
  EntiPromptContextualSourceBlock, 
  EntiPromptContextualSourceError 
} from './entiPromptContextualSourceTypes';

export function buildEntiPromptContextualSourceBlock(
  ownerId: string,
  chatId: string,
  descriptors: ContextualSourceDescriptor[]
): EntiPromptContextualSourceBlockResult {
  const block: EntiPromptContextualSourceBlock = {
    chatSources: [],
    knowledgeSources: [],
    workMaterialSources: []
  };
  const errors: EntiPromptContextualSourceError[] = [];

  const processedAttachmentIds = new Set<string>();

  for (const desc of descriptors) {
    if (processedAttachmentIds.has(desc.attachmentId)) {
      continue;
    }
    processedAttachmentIds.add(desc.attachmentId);

    const getReq = {
      attachmentId: desc.attachmentId,
      ownerType: 'enti' as const,
      ownerId: ownerId,
      scope: (desc.scope === 'chat_context' ? 'enti_chat' : desc.scope) as 'enti_chat' | 'enti_knowledge' | 'enti_work_material',
      chatId: desc.scope === 'chat_context' ? chatId : undefined
    };

    const repoResult = attachmentContentRepository.get(getReq);
    if (repoResult.status !== 'success' || !repoResult.entry) {
      errors.push({
        attachmentId: desc.attachmentId,
        status: 'blocked',
        reason: repoResult.reason || 'Not found in repository'
      });
      continue;
    }

    const entry = repoResult.entry;

    const policyCheck = entiPromptContextualSourcesPolicy({
      attachmentId: entry.attachmentId,
      ownerType: entry.ownerType,
      ownerId: entry.ownerId,
      chatId: entry.chatId,
      scope: entry.scope,
      contentText: entry.contentText
    });

    if (policyCheck.status !== 'valid') {
      errors.push({
        attachmentId: entry.attachmentId,
        status: 'blocked',
        reason: policyCheck.reason
      });
      continue;
    }

    const item = {
      attachmentId: entry.attachmentId,
      scope: entry.scope,
      contentText: entry.contentText,
      fileName: entry.metadata?.fileName as string | undefined
    };

    if (entry.scope === 'enti_chat') {
      block.chatSources.push(item);
    } else if (entry.scope === 'enti_knowledge') {
      block.knowledgeSources.push(item);
    } else if (entry.scope === 'enti_work_material') {
      block.workMaterialSources.push(item);
    }
  }

  // Ensure deterministic order
  block.chatSources.sort((a, b) => a.attachmentId.localeCompare(b.attachmentId));
  block.knowledgeSources.sort((a, b) => a.attachmentId.localeCompare(b.attachmentId));
  block.workMaterialSources.sort((a, b) => a.attachmentId.localeCompare(b.attachmentId));

  return {
    status: 'success',
    block,
    errors
  };
}
