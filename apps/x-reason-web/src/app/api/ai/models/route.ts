import { NextResponse } from 'next/server';
import { AI_MODEL_OPTIONS, DEFAULT_MODEL, ModelInfo } from '../providers';

export interface ModelsResponse {
  models: ModelInfo[];
  defaultModel: string;
  gatewayRequired: boolean;
  gatewayConfigured: boolean;
}

/**
 * GET /api/ai/models
 *
 * Returns the tiny approved model allowlist and environment-based availability flags.
 */
export async function GET() {
  try {
    const hasGatewayAuth = !!process.env.VERCEL_OIDC_TOKEN;

    const response: ModelsResponse = {
      models: AI_MODEL_OPTIONS,
      defaultModel: DEFAULT_MODEL,
      gatewayRequired: true,
      gatewayConfigured: hasGatewayAuth,
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
