import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/backend/auth/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body?.refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
    }

    const result = await authService.refreshSession(body.refreshToken);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

