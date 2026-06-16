import type { EntiCognitiveConfig } from '../enti/Enti';

export interface RuntimeExecutionStartResult {
  success: boolean;
  error?: string;
  executionId?: string;
  status: 'started' | 'rejected';
}

export interface ActiveBrainResolutionResult {
  success: boolean;
  error?: string;
  brainResolved: boolean;
  activeBrain?: EntiCognitiveConfig;
}

export interface EntiContextBuildResult {
  success: boolean;
  error?: string;
  contextId?: string;
  entiId?: string;
  chatId?: string;
  activeBrain?: EntiCognitiveConfig;
}

export interface EntiExecutionResult {
  status: 'executed' | 'blocked' | 'failed' | 'controlled_error';
  error?: string;
  executionId?: string;
  entiId?: string;
  chatId?: string;
  brainId?: string;
  contextId?: string;
  responseText?: string;
}

export interface EntiResponseReceptionResult {
  status: 'received' | 'blocked' | 'controlled_error';
  error?: string;
  executionId?: string;
  entiId?: string;
  chatId?: string;
  brainId?: string;
  contextId?: string;
}

export interface GroupSequenceInitializationResult {
  status: 'initialized' | 'blocked' | 'controlled_error';
  error?: string;
  groupId?: string;
  chatId?: string;
  sequenceId?: string;
  currentSlotId?: string;
  pendingSlotIds?: string[];
  completedSlotIds?: string[];
}

export interface GroupSlotExecutionResult {
  status: 'executed' | 'blocked' | 'controlled_error';
  error?: string;
  groupId?: string;
  slotId?: string;
  entiId?: string;
  chatId?: string;
  executionId?: string;
  responseText?: string;
}

export interface IntermediateGroupResult {
  status: 'success' | 'blocked' | 'controlled_error';
  error?: string;
  groupId?: string;
  chatId?: string;
  slotId?: string;
  entiId?: string;
  executionId?: string;
  responseText?: string;
}
