import { NextResponse } from 'next/server';
import { authService } from '@/app/[tenant]/auth/services/auth.service';
import { requireAuth, AuthenticatedRequest } from '@/app/[tenant]/auth/middleware';
import { clearImpersonationContext } from '@/app/shared/core/auth-impersonate';

async function handler() {
  try {
    // Garantia: encerrar qualquer cookie de impersonação no logout server-side.
    await clearImpersonationContext();
    await authService.signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const POST = requireAuth(handler as (request: AuthenticatedRequest) => Promise<NextResponse>);

