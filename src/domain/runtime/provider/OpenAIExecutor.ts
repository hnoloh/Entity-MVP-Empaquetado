import OpenAI from 'openai';
import type { ProviderBridge, ProviderExecutionInput, ProviderExecutionOutput } from './ProviderBridge';

export class OpenAIExecutor implements ProviderBridge {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async execute(input: ProviderExecutionInput): Promise<ProviderExecutionOutput> {
    if (process.env.NODE_ENV === 'test') {
      return {
        success: true,
        responseText: `[OPENAI] Response to: ${input.prompt}`
      };
    }

    if (!this.apiKey) {
      return { success: false, error: 'OpenAI API key is missing' };
    }

    try {
      const openai = new OpenAI({ apiKey: this.apiKey, dangerouslyAllowBrowser: true });
      
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      if (input.systemPrompt) {
        messages.push({ role: 'system', content: input.systemPrompt });
      }
      messages.push({ role: 'user', content: input.prompt });

      const response = await openai.chat.completions.create({
        model: this.model,
        messages,
      });

      const responseText = response.choices[0]?.message?.content || '';

      return {
        success: true,
        responseText
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e)
      };
    }
  }
}
