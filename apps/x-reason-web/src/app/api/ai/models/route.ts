import { NextRequest, NextResponse } from 'next/server';
import { AI_MODEL_OPTIONS, DEFAULT_MODEL, getGatewayAvailability, ModelInfo } from '../providers';

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
export async function GET(request: NextRequest) {
  try {
    const hasGatewayAuth = Object.values(getGatewayAvailability(request.headers)).some(Boolean);

    const response: ModelsResponse = {
      models: AI_MODEL_OPTIONS,
      defaultModel: DEFAULT_MODEL,
      gatewayRequired: true,
      gatewayConfigured: hasGatewayAuth,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to load model configuration' },
      { status: 500 }
    );
  }
}
