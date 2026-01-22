import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createStudentTransferService } from '@/backend/services/student';

interface RouteContext {
  params: Promise<{ turmaId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { turmaId } = await context.params;

    if (!turmaId) {
      return NextResponse.json(
        { error: 'turmaId e obrigatorio' },
        { status: 400 }
      );
    }

    const transferService = createStudentTransferService(supabase);
    const students = await transferService.getStudentsByTurma(turmaId);

    return NextResponse.json({ data: students });
  } catch (error) {
    console.error('Error fetching students by turma:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alunos da turma' },
      { status: 500 }
    );
  }
}
