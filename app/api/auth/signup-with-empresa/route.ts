import { NextRequest, NextResponse } from 'next/server';
import { EmpresaService, EmpresaRepositoryImpl } from '@/backend/services/empresa';
import { getDatabaseClient } from '@/backend/clients/database';

/**
 * Endpoint de cadastro que cria empresa automaticamente quando professor se cadastra sem empresa_id.
 * 
 * Este endpoint é chamado quando um professor faz cadastro sem estar vinculado a uma empresa existente.
 * O sistema cria automaticamente uma nova empresa e associa o professor como owner/admin.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, empresaNome } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'email, password e fullName são obrigatórios' },
        { status: 400 }
      );
    }

    const adminClient = getDatabaseClient();

    // 1. Criar empresa automaticamente
    // Usar adminClient (service role) para bypass de RLS
    const repository = new EmpresaRepositoryImpl(adminClient);
    const service = new EmpresaService(repository, adminClient);

    // Usar nome da empresa fornecido ou gerar a partir do nome do professor
    const nomeEmpresa = empresaNome || `${fullName} - Instituição`;

    const empresa = await service.create({
      nome: nomeEmpresa,
      plano: 'basico',
    });

    // 2. Criar usuário com empresa_id
    const { data: newUser, error: userError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'professor',
        full_name: fullName,
        empresa_id: empresa.id,
        is_admin: true, // Primeiro professor da empresa é admin
      },
    });

    if (userError) {
      // Se falhar ao criar usuário, tentar deletar a empresa criada
      try {
        await service.delete(empresa.id);
      } catch (deleteError) {
        console.error('Error deleting empresa after user creation failure:', deleteError);
      }

      if (userError.message?.includes('already registered') || 
          userError.message?.includes('already exists') ||
          userError.status === 422) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Erro ao criar usuário: ${userError.message || 'Erro desconhecido'}` },
        { status: 500 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    // 3. Inserir em empresa_admins como owner
    const { error: adminError } = await adminClient
      .from('empresa_admins')
      .insert({
        empresa_id: empresa.id,
        user_id: newUser.user.id,
        is_owner: true,
        permissoes: {},
      });

    if (adminError) {
      console.error('Error creating empresa_admin:', adminError);
      // Não falhar, pois o professor já foi criado
    }

    // Retornar dados do usuário e empresa criada
    return NextResponse.json(
      {
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          fullName,
        },
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          slug: empresa.slug,
        },
        message: 'Conta e empresa criadas com sucesso! Você é o administrador da empresa.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in signup-with-empresa:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

