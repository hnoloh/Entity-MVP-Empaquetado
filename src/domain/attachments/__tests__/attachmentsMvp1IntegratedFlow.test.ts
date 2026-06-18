import { describe, it, expect, beforeEach } from 'vitest';
import type { Attachment } from '../attachmentModel';
import { attachmentContentRepository } from '../attachmentContentRepository';
import { resolveEntiContextualSources } from '../resolveEntiContextualSources';
import { buildEntiPromptContextualSourceBlock } from '../../prompt-engine/attachments/buildEntiPromptContextualSourceBlock';
import { injectEntiContextualSourcesIntoPromptEngine } from '../../prompt-engine/attachments/injectEntiContextualSourcesIntoPromptEngine';
import { serializeAttachmentContentRepositorySnapshot } from '../attachmentContentPersistenceSerializer';
import { restoreAttachmentContentRepositorySnapshot } from '../restoreAttachmentContentRepositorySnapshot';
import type { ProviderExecutionInput } from '../../runtime/provider/ProviderBridge';

describe('MVP1 Attachments Integrated Flow', () => {
  beforeEach(() => {
    attachmentContentRepository.clear();
  });

  it('validates E2E Chat Attachment flow', () => {
    // 1. Drop/Intención
    const attachment: Attachment = {
      attachmentId: 'att-chat-1',
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-1',
      fileName: 'doc1.md',
      fileExtension: 'md',
      receivedAt: new Date().toISOString(),
      status: 'readable',
      source: 'user_upload'
    };

    // 2. Lectura física controlada & 3. Repositorio global
    attachmentContentRepository.upsert({
      attachmentId: attachment.attachmentId,
      ownerType: attachment.ownerType,
      ownerId: attachment.ownerId,
      chatId: attachment.chatId,
      scope: 'enti_chat',
      contentText: 'Contenido del documento 1',
      readAt: new Date().toISOString(),
      metadata: { fileName: attachment.fileName }
    });

    // 4. Persistencia
    const snapshot = attachmentContentRepository.snapshot();
    const records = serializeAttachmentContentRepositorySnapshot(snapshot);
    expect(records.length).toBe(1);

    // 5. Restauración
    attachmentContentRepository.clear();
    const restoreResult = restoreAttachmentContentRepositorySnapshot(records);
    expect(restoreResult.status).toBe('success');

    // 6. Consulta
    const resolveResult = resolveEntiContextualSources({
      ownerId: 'enti-1',
      attachments: [attachment]
    });
    expect(resolveResult.status).toBe('success');
    expect(resolveResult.sources?.length).toBe(1);
    expect(resolveResult.sources![0].scope).toBe('chat_context');

    // 7. Bloque segmentado
    const blockResult = buildEntiPromptContextualSourceBlock('enti-1', 'chat-1', resolveResult.sources!);
    expect(blockResult.status).toBe('success');
    
    // 8. systemPrompt intacto
    const baseInput: ProviderExecutionInput = {
      prompt: 'Hola',
      systemPrompt: 'System rules'
    };
    const injectResult = injectEntiContextualSourcesIntoPromptEngine(baseInput, blockResult.block!);
    expect(injectResult.status).toBe('success');
    expect(injectResult.injectedInput.systemPrompt).toBe('System rules');
    expect(injectResult.injectedInput.prompt).toContain('### ADJUNTOS DEL CHAT');
    expect(injectResult.injectedInput.prompt).toContain('[Adjunto: doc1.md]');
    expect(injectResult.injectedInput.prompt).toContain('Contenido del documento 1');
  });

  it('validates E2E Knowledge flow', () => {
    const attachment: Attachment = {
      attachmentId: 'att-know-1',
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'enti_knowledge',
      fileName: 'know.txt',
      fileExtension: 'txt',
      receivedAt: new Date().toISOString(),
      status: 'readable',
      source: 'user_upload'
    };

    attachmentContentRepository.upsert({
      attachmentId: attachment.attachmentId,
      ownerType: attachment.ownerType,
      ownerId: attachment.ownerId,
      scope: 'enti_knowledge',
      contentText: 'Contenido de conocimiento',
      readAt: new Date().toISOString(),
      metadata: { fileName: attachment.fileName }
    });

    const resolveResult = resolveEntiContextualSources({
      ownerId: 'enti-1',
      attachments: [attachment]
    });
    const blockResult = buildEntiPromptContextualSourceBlock('enti-1', 'chat-1', resolveResult.sources!);
    
    const baseInput: ProviderExecutionInput = {
      prompt: 'Resuelve',
      systemPrompt: 'System rules'
    };
    const injectResult = injectEntiContextualSourcesIntoPromptEngine(baseInput, blockResult.block!);
    expect(injectResult.injectedInput.systemPrompt).toBe('System rules');
    expect(injectResult.injectedInput.prompt).toContain('### CONOCIMIENTOS BASE');
    expect(injectResult.injectedInput.prompt).toContain('Contenido de conocimiento');
  });

  it('validates E2E Work Material flow', () => {
    const attachment: Attachment = {
      attachmentId: 'att-work-1',
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'enti_work_material',
      fileName: 'work.txt',
      fileExtension: 'txt',
      receivedAt: new Date().toISOString(),
      status: 'readable',
      source: 'user_upload'
    };

    attachmentContentRepository.upsert({
      attachmentId: attachment.attachmentId,
      ownerType: attachment.ownerType,
      ownerId: attachment.ownerId,
      scope: 'enti_work_material',
      contentText: 'Contenido de trabajo',
      readAt: new Date().toISOString(),
      metadata: { fileName: attachment.fileName }
    });

    const resolveResult = resolveEntiContextualSources({
      ownerId: 'enti-1',
      attachments: [attachment]
    });
    const blockResult = buildEntiPromptContextualSourceBlock('enti-1', 'chat-1', resolveResult.sources!);
    
    const baseInput: ProviderExecutionInput = {
      prompt: 'Hazlo',
      systemPrompt: 'System rules'
    };
    const injectResult = injectEntiContextualSourcesIntoPromptEngine(baseInput, blockResult.block!);
    expect(injectResult.injectedInput.systemPrompt).toBe('System rules');
    expect(injectResult.injectedInput.prompt).toContain('### MATERIAL DE TRABAJO ACTIVO');
    expect(injectResult.injectedInput.prompt).toContain('Contenido de trabajo');
  });

  it('validates Scope Isolation', () => {
    const attA: Attachment = {
      attachmentId: 'att-A',
      ownerType: 'enti',
      ownerId: 'enti-1',
      chatId: 'chat-A',
      fileName: 'A.txt',
      fileExtension: 'txt',
      receivedAt: new Date().toISOString(),
      status: 'readable',
      source: 'user_upload'
    };
    attachmentContentRepository.upsert({
      attachmentId: attA.attachmentId, ownerType: 'enti', ownerId: 'enti-1', chatId: 'chat-A', scope: 'enti_chat', contentText: 'A', readAt: new Date().toISOString()
    });

    const resolveResult = resolveEntiContextualSources({
      ownerId: 'enti-1',
      attachments: [attA]
    });
    
    const blockResult = buildEntiPromptContextualSourceBlock('enti-1', 'chat-B', resolveResult.sources!);
    expect(blockResult.block?.chatSources.length).toBe(0);
  });

  it('validates Controlled errors (invalid input does not break batch)', () => {
    const result = attachmentContentRepository.upsert({
      attachmentId: '', // Invalid empty ID
      ownerType: 'enti',
      ownerId: 'enti-1',
      scope: 'enti_chat',
      contentText: '123',
      readAt: new Date().toISOString()
    });
    expect(result.status).toBe('blocked');
    expect(attachmentContentRepository.snapshot().entries.length).toBe(0);
  });
});
