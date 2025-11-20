import { NextResponse } from 'next/server';
import { authService } from '@/backend/auth/auth.service';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

async function handler() {
  try {
    await authService.signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const POST = requireAuth(handler as (request: AuthenticatedRequest) => Promise<NextResponse>);

