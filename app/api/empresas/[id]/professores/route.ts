import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { TeacherRepositoryImpl } from '@/backend/services/teacher';
import { getAuthUser } from '@/backend/auth/middleware';
import { getEmpresaContext, validateEmpresaAccess } from '@/backend/middleware/empresa-context';

// GET /api/empresas/[id]/professores - Listar professores da empresa
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request);
    if (!validateEmpresaAccess(context, params.id) && !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const repository = new TeacherRepositoryImpl(supabase);
    const professores = await repository.findByEmpresa(params.id);

    return NextResponse.json(professores);
  } catch (error) {
    console.error('Error listing professores:', error);
    return NextResponse.json(
      { error: 'Erro ao listar professores' },
      { status: 500 }
    );
  }
}

// POST /api/empresas/[id]/professores - Adicionar professor
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request);
    if (!validateEmpresaAccess(context, params.id) && !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas admin da empresa pode adicionar professores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, fullName, password, isAdmin } = body;

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: 'email, fullName e password são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar usuário no auth
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'professor',
        full_name: fullName,
        empresa_id: params.id,
        is_admin: isAdmin || false,
      },
    });

    if (userError) {
      throw userError;
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    // O registro de professor será criado automaticamente pela trigger handle_new_user
    // Mas podemos buscar para retornar
    const repository = new TeacherRepositoryImpl(supabase);
    const professor = await repository.findById(newUser.user.id);

    return NextResponse.json(professor, { status: 201 });
  } catch (error: any) {
    console.error('Error creating professor:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar professor' },
      { status: 500 }
    );
  }
}

