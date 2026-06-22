/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from 'openai';
import type { ProviderBridge, ProviderExecutionInput, ProviderExecutionOutput } from './ProviderBridge';
import { parseToolCallsIntoXml } from './parseToolCalls';

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
      
      let messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      if (input.messages && input.messages.length > 0) {
        if (input.systemPrompt) {
          messages.push({ role: 'system', content: input.systemPrompt });
        }
        messages = messages.concat(input.messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>);
      } else {
        if (input.systemPrompt) {
          messages.push({ role: 'system', content: input.systemPrompt });
        }
        messages.push({ role: 'user', content: input.prompt });
      }

      const payload: Record<string, unknown> = {
        model: this.model,
        messages,
      };

      if (input.tools && input.tools.length > 0) {
        payload.tools = input.tools;
      }

      const response: any = await openai.chat.completions.create(payload as any);

      const message = response.choices[0]?.message;
      let responseText = message?.content || '';

      if (response.choices[0].message.tool_calls && response.choices[0].message.tool_calls.length > 0) {
        responseText += parseToolCallsIntoXml(response.choices[0].message.tool_calls);
      }

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
