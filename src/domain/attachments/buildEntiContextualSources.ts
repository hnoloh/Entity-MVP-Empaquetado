import type { Attachment } from './attachmentModel';
import type { ContextualSourceDescriptor, ContextualSourceScope } from './contextualSourceTypes';
import { contextualSourcesPolicy } from './contextualSourcesPolicy';

export function buildEntiContextualSources(ownerId: string, attachments: Attachment[]): ContextualSourceDescriptor[] {
  const sources: ContextualSourceDescriptor[] = [];

  for (const attachment of attachments) {
    if (attachment.ownerId !== ownerId || attachment.ownerType !== 'enti') continue;

    let scope: ContextualSourceScope;
    let chatId: string | undefined = undefined;

    if (attachment.chatId === 'enti_knowledge') {
      scope = 'enti_knowledge';
    } else if (attachment.chatId === 'enti_work_material') {
      scope = 'enti_work_material';
    } else {
      scope = 'chat_context';
      chatId = attachment.chatId;
    }

    if (!scope) continue;

    const policyResult = contextualSourcesPolicy({ ownerType: 'enti', scope });
    if (policyResult.status === 'success') {
      sources.push({
        attachmentId: attachment.attachmentId,
        ownerType: 'enti',
        ownerId,
        chatId,
        scope
      });
    }
  }

  // Sort deterministically by attachment id
  return sources.sort((a, b) => a.attachmentId.localeCompare(b.attachmentId));
}
