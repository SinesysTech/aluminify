import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { EmpresaService, EmpresaRepositoryImpl } from '@/backend/services/empresa';
import { getAuthUser } from '@/backend/auth/middleware';

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

    const supabase = await createClient();

    const repository = new EmpresaRepositoryImpl(supabase);
    const service = new EmpresaService(repository, supabase);
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

    const supabase = await createClient();

    const body = await request.json();
    const { nome, cnpj, emailContato, telefone, plano, primeiroAdminEmail, primeiroAdminNome, primeiroAdminPassword } = body;

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      );
    }

    const repository = new EmpresaRepositoryImpl(supabase);
    const service = new EmpresaService(repository, supabase);

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
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
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
        await supabase
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
  } catch (error: any) {
    console.error('Error creating empresa:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar empresa' },
      { status: 500 }
    );
  }
}

