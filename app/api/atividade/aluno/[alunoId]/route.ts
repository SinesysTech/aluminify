import { NextResponse, type NextRequest } from 'next/server';
import { atividadeService, AtividadeValidationError } from '@/backend/services/atividade';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

function serializeAtividadeComProgresso(atividade: Awaited<ReturnType<typeof atividadeService.listByAlunoMatriculas>>[0]) {
  return {
    id: atividade.id,
    moduloId: atividade.moduloId,
    tipo: atividade.tipo,
    titulo: atividade.titulo,
    arquivoUrl: atividade.arquivoUrl,
    gabaritoUrl: atividade.gabaritoUrl,
    linkExterno: atividade.linkExterno,
    obrigatorio: atividade.obrigatorio,
    ordemExibicao: atividade.ordemExibicao,
    createdAt: atividade.createdAt.toISOString(),
    updatedAt: atividade.updatedAt.toISOString(),
    moduloNome: atividade.moduloNome,
    moduloNumero: atividade.moduloNumero,
    frenteNome: atividade.frenteNome,
    frenteId: atividade.frenteId,
    disciplinaNome: atividade.disciplinaNome,
    disciplinaId: atividade.disciplinaId,
    cursoNome: atividade.cursoNome,
    cursoId: atividade.cursoId,
    progressoStatus: atividade.progressoStatus,
    progressoDataInicio: atividade.progressoDataInicio?.toISOString() || null,
    progressoDataConclusao: atividade.progressoDataConclusao?.toISOString() || null,
  };
}

function handleError(error: unknown) {
  if (error instanceof AtividadeValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error('Atividade Aluno API Error:', error);
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
  params: Promise<{ alunoId: string }>;
}

// GET: Listar atividades do aluno (agrupadas por estrutura)
async function getHandler(request: AuthenticatedRequest, params: { alunoId: string }) {
  try {
    const alunoId = params.alunoId;

    // Verificar permissão: aluno só pode ver suas próprias atividades
    if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
      if (request.user.id !== alunoId) {
        return NextResponse.json({ error: 'Forbidden: You can only access your own activities' }, { status: 403 });
      }
    }

    const atividades = await atividadeService.listByAlunoMatriculas(alunoId);
    return NextResponse.json({ data: atividades.map(serializeAtividadeComProgresso) });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => getHandler(req, params))(request);
}

