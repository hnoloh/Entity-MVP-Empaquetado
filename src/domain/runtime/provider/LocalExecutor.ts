import type { ProviderBridge, ProviderExecutionInput, ProviderExecutionOutput } from './ProviderBridge';

export class LocalExecutor implements ProviderBridge {
  private model: string;
  private endpoint: string;

  constructor(model: string, endpoint: string = 'http://localhost:11434/api/chat') {
    this.model = model;
    this.endpoint = endpoint;
  }

  async execute(input: ProviderExecutionInput): Promise<ProviderExecutionOutput> {
    if (process.env.NODE_ENV === 'test') {
      return {
        success: true,
        responseText: `[LOCAL] Response to: ${input.prompt}`
      };
    }

    if (!this.model) {
      return { success: false, error: 'Local model is not specified' };
    }

    try {
      const messages: Array<{ role: string; content: string }> = [];
      if (input.systemPrompt) {
        messages.push({ role: 'system', content: input.systemPrompt });
      }
      messages.push({ role: 'user', content: input.prompt });

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          stream: false
        })
      });

      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        responseText: data.message?.content || ''
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e)
      };
    }
  }
}
