import type { ProviderBridge, ProviderExecutionInput, ProviderExecutionOutput } from './ProviderBridge';
import { parseToolCallsIntoXml } from './parseToolCalls';

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
      let messages: Array<{ role: string; content: string }> = [];
      if (input.messages && input.messages.length > 0) {
        if (input.systemPrompt) {
          messages.push({ role: 'system', content: input.systemPrompt });
        }
        messages = messages.concat(input.messages);
      } else {
        if (input.systemPrompt) {
          messages.push({ role: 'system', content: input.systemPrompt });
        }
        messages.push({ role: 'user', content: input.prompt });
      }

      const bodyPayload: Record<string, unknown> = {
        model: this.model,
        messages: messages,
        stream: false
      };

      if (input.tools && input.tools.length > 0) {
        bodyPayload.tools = input.tools;
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let responseText = data.message?.content || '';

      if (data.message?.tool_calls && data.message.tool_calls.length > 0) {
        responseText += parseToolCallsIntoXml(data.message.tool_calls);
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
