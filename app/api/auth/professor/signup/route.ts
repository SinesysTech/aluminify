import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/backend/clients/database';

/**
 * POST /api/auth/professor/signup
 *
 * Cadastro público de professor SEM empresa (onboarding).
 * - Cria usuário no Supabase Auth via admin client
 * - Insere registro em `public.professores` com `empresa_id = null`
 * - Atualiza metadata com `role: 'professor'` (sem disparar trigger de insert)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');
    const fullName = String(body?.fullName ?? '').trim();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'email, password e fullName são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    const adminClient = getDatabaseClient();

    // 1) Criar usuário sem role no metadata para não exigir empresa_id no trigger de insert
    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createUserError || !createdUser.user) {
      if (
        createUserError?.message?.includes('already registered') ||
        createUserError?.message?.includes('already exists') ||
        createUserError?.status === 422
      ) {
        return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 });
      }

      return NextResponse.json(
        { error: `Erro ao criar usuário: ${createUserError?.message || 'Erro desconhecido'}` },
        { status: 500 }
      );
    }

    const userId = createdUser.user.id;

    // 2) Criar registro de professor com empresa_id null (apenas admin consegue)
    const { error: insertProfessorError } = await adminClient.from('professores').insert({
      id: userId,
      email,
      nome_completo: fullName,
      empresa_id: null,
      is_admin: false,
      cpf: null,
      telefone: null,
    } as any);
      biografia: null,
      foto_url: null,
      especialidade: null,
    });

    if (insertProfessorError) {
      // rollback best-effort
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Erro ao criar registro de professor: ${insertProfessorError.message}` },
        { status: 500 }
      );
    }

    // 3) Atualizar metadata para role professor (não dispara trigger de insert)
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: 'professor',
        full_name: fullName,
        is_admin: false,
      },
    });

    return NextResponse.json(
      {
        user: { id: userId, email, fullName },
        message: 'Conta de professor criada. Agora você pode cadastrar sua empresa dentro do app.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in professor signup:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


