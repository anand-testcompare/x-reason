import { NextRequest, NextResponse } from 'next/server';
import { getGatewayAvailability } from '../../ai/providers';

export async function GET(request: NextRequest) {
  const hasServerCredentials = getGatewayAvailability(request.headers);

  const hasAnyServerCredentials = Object.values(hasServerCredentials).some(Boolean);

  return NextResponse.json({
    hasServerCredentials: hasAnyServerCredentials,
    available: hasServerCredentials,
  });
}
