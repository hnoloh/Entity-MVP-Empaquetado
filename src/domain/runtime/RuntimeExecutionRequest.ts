import { GroupSequenceInitializationResult, GroupSlotExecutionResult, IntermediateGroupResult, IntermediateGroupValidationResult } from './RuntimeExecutionResult';

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

export interface IntermediateGroupResultRequest {
  sequenceState: GroupSequenceInitializationResult;
  groupId: string;
  currentSlotId: string;
  slotExecutionResult: GroupSlotExecutionResult;
  explicitUserAction: boolean;
  chatId?: string;
}

export interface IntermediateGroupValidationRequest {
  intermediateResult: IntermediateGroupResult;
  explicitUserAction: boolean;
}

export interface ValidatedIntermediateGroupResultSendRequest {
  intermediateResult: IntermediateGroupResult;
  validationResult: IntermediateGroupValidationResult;
  explicitUserAction: boolean;
}

export interface GroupSequenceAdvanceRequest {
  explicitUserAction: boolean;
  groupId: string;
  chatId: string;
  currentSlotId: string;
  sequenceState: GroupSequenceInitializationResult;
  sentResult: ValidatedIntermediateGroupResultSendResult;
}
