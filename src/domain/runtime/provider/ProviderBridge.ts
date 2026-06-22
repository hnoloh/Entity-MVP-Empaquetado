export interface ProviderExecutionInput {
  prompt: string;
  messages?: Array<{role: string, content: string}>;
  systemPrompt?: string;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: unknown;
    }
  }>;
}

export interface ProviderExecutionOutput {
  success: boolean;
  error?: string;
  responseText?: string;
}

export interface ProviderBridge {
  execute(input: ProviderExecutionInput): Promise<ProviderExecutionOutput>;
}
