import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/backend/auth/middleware';
import { getDatabaseClient } from '@/backend/clients/database';
import { EmpresaRepositoryImpl, EmpresaService } from '@/backend/services/empresa';

/**
 * POST /api/empresas/self
 *
 * Permite que um professor SEM empresa crie sua própria empresa (onboarding)
 * e seja vinculado como owner/admin.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'professor') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas professor pode criar empresa neste fluxo.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const nome = String(body?.nome ?? '').trim();
    const cnpj = body?.cnpj ? String(body.cnpj).trim() : undefined;
    const emailContato = body?.emailContato ? String(body.emailContato).trim() : undefined;
    const telefone = body?.telefone ? String(body.telefone).trim() : undefined;

    if (!nome) {
      return NextResponse.json({ error: 'Nome da empresa é obrigatório' }, { status: 400 });
    }

    const adminClient = getDatabaseClient();

    // Confirmar que o professor existe e ainda não está vinculado a uma empresa
    const { data: professor, error: professorError } = await adminClient
      .from('professores')
      .select('id, empresa_id')
      .eq('id', user.id)
      .maybeSingle();

    if (professorError || !professor) {
      return NextResponse.json({ error: 'Professor não encontrado' }, { status: 404 });
    }

    if (professor.empresa_id) {
      return NextResponse.json(
        { error: 'Este professor já está vinculado a uma empresa' },
        { status: 409 }
      );
    }

    // 1) Criar empresa com bypass de RLS (service role)
    const repository = new EmpresaRepositoryImpl(adminClient);
    const service = new EmpresaService(repository, adminClient);
    const empresa = await service.create({
      nome,
      cnpj,
      emailContato,
      telefone,
      plano: 'basico',
    });

    // 2) Vincular professor à empresa e marcar como admin
    const { error: updateProfessorError } = await adminClient
      .from('professores')
      .update({ empresa_id: empresa.id, is_admin: true })
      .eq('id', user.id);

    if (updateProfessorError) {
      return NextResponse.json(
        { error: `Erro ao vincular professor à empresa: ${updateProfessorError.message}` },
        { status: 500 }
      );
    }

    // 3) Inserir em empresa_admins como owner
    await adminClient.from('empresa_admins').insert({
      empresa_id: empresa.id,
      user_id: user.id,
      is_owner: true,
      permissoes: {},
    });

    // 4) Atualizar metadata do usuário (melhora UX de contexto no frontend)
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        role: 'professor',
        empresa_id: empresa.id,
        is_admin: true,
      },
    });

    return NextResponse.json(
      {
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          slug: empresa.slug,
          plano: empresa.plano,
        },
        message: 'Empresa criada e vinculada ao professor com sucesso.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating self empresa:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar empresa';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


