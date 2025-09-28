import { NextResponse } from 'next/server';

export async function GET() {
  const hasServerCredentials = {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
  };

  const hasAnyServerCredentials = Object.values(hasServerCredentials).some(Boolean);

  return NextResponse.json({
    hasServerCredentials: hasAnyServerCredentials,
    available: hasServerCredentials,
  });
}