import { NextResponse } from 'next/server';

export async function GET() {
  const hasGatewayAuth = !!process.env.VERCEL_OIDC_TOKEN;
  const hasServerCredentials = {
    openai: hasGatewayAuth,
    gemini: hasGatewayAuth,
  };

  const hasAnyServerCredentials = Object.values(hasServerCredentials).some(Boolean);

  return NextResponse.json({
    hasServerCredentials: hasAnyServerCredentials,
    available: hasServerCredentials,
  });
}
