import { GroupSequenceInitializationResult } from './RuntimeExecutionResult';

export interface RuntimeExecutionRequest {
  entiId: string;
  chatId: string;
  explicitUserAction: boolean;
  targetType: 'ENTI';
}

export type ActiveBrainResolutionRequest = RuntimeExecutionRequest;

export type EntiContextBuildRequest = RuntimeExecutionRequest;

export type EntiExecutionRequest = RuntimeExecutionRequest;

export interface EntiResponseReceptionRequest extends RuntimeExecutionRequest {
  executionId?: string;
  responseText?: string;
}

export interface GroupSequenceInitializationRequest {
  groupId: string;
  groupChatId: string;
  requestedByUserAction: boolean;
  targetType: 'GROUP';
}

export interface GroupSlotExecutionRequest {
  sequenceState: GroupSequenceInitializationResult;
  groupId: string;
  chatId: string;
  currentSlotId: string;
  explicitUserAction: boolean;
}
