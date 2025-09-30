import { NextResponse } from 'next/server';

export async function GET() {
  // Check for AI Gateway key (preferred) or individual provider keys
  const hasServerCredentials = {
    openai: !!process.env.AI_GATEWAY_API_KEY || !!process.env.OPENAI_API_KEY,
    // Vercel AI SDK uses GOOGLE_GENERATIVE_AI_API_KEY for Gemini
    gemini: !!process.env.AI_GATEWAY_API_KEY || !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  };

  const hasAnyServerCredentials = Object.values(hasServerCredentials).some(Boolean);

  return NextResponse.json({
    hasServerCredentials: hasAnyServerCredentials,
    available: hasServerCredentials,
  });
}