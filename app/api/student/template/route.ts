import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { StudentTemplateService } from '@/backend/services/student/student-template.service';

export async function GET() {
  try {
    // Apenas superadmins podem baixar o template
    await requireUser({ allowedRoles: ['superadmin'] });

    const templateService = new StudentTemplateService();
    const buffer = await templateService.generateTemplate();

    const filename = `modelo-importacao-alunos-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Erro ao gerar template de importação:', error);

    if (error instanceof Error && error.message.includes('Acesso negado')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro ao gerar template de importação' },
      { status: 500 }
    );
  }
}
