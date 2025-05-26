import {
  type AnthropicProvider as AnthropicSDKProvider,
  createAnthropic,
} from '@ai-sdk/anthropic';

import { CopilotProviderType, ModelInputType, ModelOutputType } from '../types';
import { AnthropicProvider } from './anthropic';

export type AnthropicOfficialConfig = {
  apiKey: string;
  baseUrl?: string;
};

export class AnthropicOfficialProvider extends AnthropicProvider<AnthropicOfficialConfig> {
  override readonly type = CopilotProviderType.Anthropic;

  override readonly models = [
    {
      id: 'claude-opus-4-20250514',
      capabilities: [
        {
          input: [ModelInputType.Text, ModelInputType.Image],
          output: [ModelOutputType.Text],
        },
      ],
    },
    {
      id: 'claude-sonnet-4-20250514',
      capabilities: [
        {
          input: [ModelInputType.Text, ModelInputType.Image],
          output: [ModelOutputType.Text],
        },
      ],
    },
    {
      id: 'claude-3-7-sonnet-20250219',
      capabilities: [
        {
          input: [ModelInputType.Text, ModelInputType.Image],
          output: [ModelOutputType.Text],
        },
      ],
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      capabilities: [
        {
          input: [ModelInputType.Text, ModelInputType.Image],
          output: [ModelOutputType.Text],
          defaultForOutputType: true,
        },
      ],
    },
  ];

  protected instance!: AnthropicSDKProvider;

  override configured(): boolean {
    return !!this.config.apiKey;
  }

  override setup() {
    super.setup();
    this.instance = createAnthropic({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
    });
  }
}
