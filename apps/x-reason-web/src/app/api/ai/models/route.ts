import { NextResponse } from 'next/server';
import {
  OPENAI_MODELS, DEFAULT_OPENAI_MODEL,
  GEMINI_MODELS, DEFAULT_GEMINI_MODEL,
  XAI_MODELS, DEFAULT_XAI_MODEL,
  ModelInfo,
} from '../providers';

export interface ProviderInfo {
  id: string;
  name: string;
  enabled: boolean;
  models: Record<string, ModelInfo>;
  defaultModel: string;
}

export interface ModelsResponse {
  providers: ProviderInfo[];
  gatewayRequired: boolean;
  gatewayConfigured: boolean;
}

/**
 * GET /api/ai/models
 *
 * Returns comprehensive metadata about all configured providers,
 * available models, defaults, and environment-based availability flags.
 */
export async function GET() {
  try {
    const hasGatewayKey = !!process.env.AI_GATEWAY_API_KEY;

    const response: ModelsResponse = {
      providers: [
        {
          id: 'openai',
          name: 'OpenAI (Primary)',
          enabled: hasGatewayKey,
          models: OPENAI_MODELS,
          defaultModel: DEFAULT_OPENAI_MODEL,
        },
        {
          id: 'xai',
          name: 'X.AI (Grok)',
          enabled: hasGatewayKey,
          models: XAI_MODELS,
          defaultModel: DEFAULT_XAI_MODEL,
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          enabled: hasGatewayKey,
          models: GEMINI_MODELS,
          defaultModel: DEFAULT_GEMINI_MODEL,
        },
      ],
      gatewayRequired: true,
      gatewayConfigured: hasGatewayKey,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to load model configuration' },
      { status: 500 }
    );
  }
}