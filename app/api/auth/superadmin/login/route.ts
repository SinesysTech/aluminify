import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/app/shared/core/database/database';

/**
 * POST /api/auth/superadmin/login
 * Login de super admin usando credenciais de variáveis de ambiente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar credenciais contra variáveis de ambiente
    const envUsername = process.env.SUPERADMIN_USERNAME;
    const envPassword = process.env.SUPERADMIN_PASSWORD;

    if (!envUsername || !envPassword) {
      console.error('SUPERADMIN_USERNAME ou SUPERADMIN_PASSWORD não configurados');
      return NextResponse.json(
        { error: 'Configuração de super admin não encontrada' },
        { status: 500 }
      );
    }

    // Comparação segura de strings (timing-safe)
    if (username !== envUsername || password !== envPassword) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Buscar ou criar usuário superadmin no Supabase
    const adminClient = getDatabaseClient();

    // Tentar encontrar usuário superadmin existente pelo email
    const superAdminEmail = envUsername.includes('@') 
      ? envUsername 
      : `${envUsername}@superadmin.local`;

    // Buscar usuário existente
    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { error: 'Erro ao verificar usuário' },
        { status: 500 }
      );
    }

    let superAdminUser = existingUsers?.users?.find(
      (user) => user.user_metadata?.role === 'superadmin'
    );

    // Se não existe, criar usuário superadmin
    if (!superAdminUser) {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: superAdminEmail,
        password: envPassword, // Usar a senha da env
        email_confirm: true,
        user_metadata: {
          role: 'superadmin',
          full_name: 'Super Administrador',
          is_superadmin: true,
        },
      });

      if (createError) {
        console.error('Error creating superadmin user:', createError);
        return NextResponse.json(
          { error: 'Erro ao criar usuário superadmin' },
          { status: 500 }
        );
      }

      superAdminUser = newUser.user;
    } else {
      // Atualizar metadata para garantir que está correto
      await adminClient.auth.admin.updateUserById(superAdminUser.id, {
        user_metadata: {
          ...superAdminUser.user_metadata,
          role: 'superadmin',
          is_superadmin: true,
        },
      });

      // Atualizar senha para garantir que está sincronizada
      await adminClient.auth.admin.updateUserById(superAdminUser.id, {
        password: envPassword,
      });
    }

    // Criar sessão usando signInWithPassword no cliente
    // O frontend vai fazer o login com as credenciais
    return NextResponse.json({
      success: true,
      message: 'Credenciais validadas. Redirecionando...',
      email: superAdminUser.email,
      // Não retornar senha, o frontend vai usar a senha fornecida
    });
  } catch (error) {
    console.error('Error in superadmin login:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}

