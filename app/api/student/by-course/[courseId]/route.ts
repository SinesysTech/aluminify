import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createStudentTransferService } from '@/backend/services/student';

interface RouteContext {
  params: Promise<{ courseId: string }>;
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

    const { courseId } = await context.params;

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId e obrigatorio' },
        { status: 400 }
      );
    }

    const transferService = createStudentTransferService(supabase);
    const students = await transferService.getStudentsByCourse(courseId);

    return NextResponse.json({ data: students });
  } catch (error) {
    console.error('Error fetching students by course:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alunos do curso' },
      { status: 500 }
    );
  }
}
