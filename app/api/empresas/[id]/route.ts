import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { EmpresaService, EmpresaRepositoryImpl } from '@/backend/services/empresa';
import { getAuthUser } from '@/backend/auth/middleware';
import { getEmpresaContext, validateEmpresaAccess } from '@/backend/middleware/empresa-context';

// GET /api/empresas/[id] - Detalhes da empresa
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

    const repository = new EmpresaRepositoryImpl(supabase);
    const service = new EmpresaService(repository, supabase);
    const empresa = await service.findById(params.id);

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar acesso
    const context = await getEmpresaContext(supabase, user.id, request);
    if (!validateEmpresaAccess(context, empresa.id) && !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    return NextResponse.json(empresa);
  } catch (error) {
    console.error('Error fetching empresa:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar empresa' },
      { status: 500 }
    );
  }
}

// PATCH /api/empresas/[id] - Atualizar empresa
export async function PATCH(
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

    const body = await request.json();
    const repository = new EmpresaRepositoryImpl(supabase);
    const service = new EmpresaService(repository, supabase);

    // Verificar acesso
    const context = await getEmpresaContext(supabase, user.id, request);
    if (!validateEmpresaAccess(context, params.id) && !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas admin da empresa ou superadmin pode atualizar.' },
        { status: 403 }
      );
    }

    const empresa = await service.update(params.id, body);
    return NextResponse.json(empresa);
  } catch (error) {
    console.error('Error updating empresa:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar empresa';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/empresas/[id] - Deletar empresa (apenas superadmin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmin pode deletar empresas.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const repository = new EmpresaRepositoryImpl(supabase);
    const service = new EmpresaService(repository, supabase);
    await service.delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting empresa:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar empresa';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

