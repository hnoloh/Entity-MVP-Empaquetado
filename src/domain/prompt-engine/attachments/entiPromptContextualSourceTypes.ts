import type { ContextualSourceScope } from '../../attachments/contextualSourceTypes';

export interface EntiPromptContextualSourceBlockItem {
  attachmentId: string;
  scope: ContextualSourceScope;
  contentText: string;
  fileName?: string;
}

export interface EntiPromptContextualSourceBlock {
  chatSources: EntiPromptContextualSourceBlockItem[];
  knowledgeSources: EntiPromptContextualSourceBlockItem[];
  workMaterialSources: EntiPromptContextualSourceBlockItem[];
}

export type EntiPromptContextualSourceError = {
  attachmentId: string;
  status: 'blocked' | 'controlled_error';
  reason: string;
};

export type EntiPromptContextualSourceBlockResult = 
  | { status: 'success'; block: EntiPromptContextualSourceBlock; errors: EntiPromptContextualSourceError[] }
  | { status: 'blocked'; reason: string }
  | { status: 'controlled_error'; reason: string };
