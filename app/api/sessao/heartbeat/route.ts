import { NextResponse } from 'next/server';
import { requireUserAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import {
  sessaoEstudoService,
  SessaoEstudoNotFoundError,
  SessaoEstudoValidationError,
} from '@/backend/services/sessao-estudo';

async function handler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    await sessaoEstudoService.heartbeat(request.user!.id, body?.sessao_id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SessaoEstudoValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SessaoEstudoNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error('[sessao/heartbeat]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export const PATCH = requireUserAuth(handler);



















