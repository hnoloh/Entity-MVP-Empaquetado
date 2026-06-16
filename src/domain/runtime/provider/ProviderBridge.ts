export interface ProviderExecutionInput {
  prompt: string;
  systemPrompt?: string;
}

export interface ProviderExecutionOutput {
  success: boolean;
  error?: string;
  responseText?: string;
}

export interface ProviderBridge {
  execute(input: ProviderExecutionInput): Promise<ProviderExecutionOutput>;
}
