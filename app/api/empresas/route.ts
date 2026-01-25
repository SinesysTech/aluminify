import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/app/shared/core/database/database';
import { EmpresaService, EmpresaRepositoryImpl } from '@/app/[tenant]/(dashboard)/empresa/services';
import { getAuthUser } from '@/app/[tenant]/auth/middleware';

// GET /api/empresas - Listar empresas (apenas superadmin)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmin pode listar empresas.' },
        { status: 403 }
      );
    }

    // Usar cliente admin para bypass de RLS
    const adminClient = getDatabaseClient();

    const repository = new EmpresaRepositoryImpl(adminClient);
    const service = new EmpresaService(repository, adminClient);
    const empresas = await service.listAll();

    return NextResponse.json(empresas);
  } catch (error) {
    console.error('Error listing empresas:', error);
    return NextResponse.json(
      { error: 'Erro ao listar empresas' },
      { status: 500 }
    );
  }
}

// POST /api/empresas - Criar nova empresa (apenas superadmin)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmin pode criar empresas.' },
        { status: 403 }
      );
    }

    // Usar cliente admin para bypass de RLS
    const adminClient = getDatabaseClient();

    const body = await request.json();
    const { nome, cnpj, emailContato, telefone, plano, primeiroAdminEmail, primeiroAdminNome, primeiroAdminPassword } = body;

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      );
    }

    const repository = new EmpresaRepositoryImpl(adminClient);
    const service = new EmpresaService(repository, adminClient);

    // Criar empresa
    const empresa = await service.create({
      nome,
      cnpj,
      emailContato,
      telefone,
      plano: plano || 'basico',
    });

    // Se primeiroAdminEmail fornecido, criar primeiro admin
    if (primeiroAdminEmail && primeiroAdminNome && primeiroAdminPassword) {
      const { data: newUser, error: userError } = await adminClient.auth.admin.createUser({
        email: primeiroAdminEmail,
        password: primeiroAdminPassword,
        email_confirm: true,
        user_metadata: {
          role: 'professor',
          full_name: primeiroAdminNome,
          empresa_id: empresa.id,
          is_admin: true,
        },
      });

      if (userError) {
        console.error('Error creating first admin:', userError);
        // Não falhar a criação da empresa, apenas logar o erro
      } else if (newUser.user) {
        // Inserir em empresa_admins como owner
        await adminClient
          .from('empresa_admins')
          .insert({
            empresa_id: empresa.id,
            user_id: newUser.user.id,
            is_owner: true,
            permissoes: {},
          });
      }
    }

    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    console.error('Error creating empresa:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao criar empresa';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

