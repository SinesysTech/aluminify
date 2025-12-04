import { NextResponse, type NextRequest } from 'next/server';
import { progressoAtividadeService, ProgressoNotFoundError, ProgressoValidationError } from '@/backend/services/progresso-atividade';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

const serializeProgresso = (progresso: Awaited<ReturnType<typeof progressoAtividadeService.getProgressoById>>) => ({
  id: progresso.id,
  alunoId: progresso.alunoId,
  atividadeId: progresso.atividadeId,
  status: progresso.status,
  dataInicio: progresso.dataInicio?.toISOString() || null,
  dataConclusao: progresso.dataConclusao?.toISOString() || null,
  questoesTotais: progresso.questoesTotais,
  questoesAcertos: progresso.questoesAcertos,
  dificuldadePercebida: progresso.dificuldadePercebida,
  anotacoesPessoais: progresso.anotacoesPessoais,
  createdAt: progresso.createdAt.toISOString(),
  updatedAt: progresso.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof ProgressoNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ProgressoValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error('Progresso API Error:', error);
  let errorMessage = 'Internal server error';
  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
    console.error('Error stack:', error.stack);
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message);
  }

  return NextResponse.json({
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
  }, { status: 500 });
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: Buscar progresso por ID
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const progresso = await progressoAtividadeService.getProgressoById(params.id);
    return NextResponse.json({ data: serializeProgresso(progresso) });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH: Atualizar progresso
async function patchHandler(request: AuthenticatedRequest, params: { id: string }) {
  try {
    const body = await request.json();

    // Verificar permissão: aluno só pode atualizar seu próprio progresso
    const progresso = await progressoAtividadeService.getProgressoById(params.id);
    if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
      if (request.user.id !== progresso.alunoId) {
        return NextResponse.json({ error: 'Forbidden: You can only update your own progress' }, { status: 403 });
      }
    }

    const updated = await progressoAtividadeService.updateProgresso(params.id, {
      status: body?.status,
      dataInicio: body?.dataInicio ? new Date(body.dataInicio) : undefined,
      dataConclusao: body?.dataConclusao ? new Date(body.dataConclusao) : undefined,
      questoesTotais: body?.questoesTotais,
      questoesAcertos: body?.questoesAcertos,
      dificuldadePercebida: body?.dificuldadePercebida,
      anotacoesPessoais: body?.anotacoesPessoais,
    });

    return NextResponse.json({ data: serializeProgresso(updated) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => patchHandler(req, params))(request);
}

