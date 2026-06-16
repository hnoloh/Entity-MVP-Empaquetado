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
