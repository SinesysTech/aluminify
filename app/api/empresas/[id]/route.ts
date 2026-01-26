import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/shared/core/database.types';
import { EmpresaService, EmpresaRepositoryImpl } from '@/app/[tenant]/(modules)/empresa/services';
import { getAuthUser } from '@/app/[tenant]/auth/middleware';
import { getEmpresaContext, validateEmpresaAccess } from '@/app/shared/core/middleware/empresa-context';
import { getPublicSupabaseConfig } from '@/app/shared/core/supabase-public-env';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Criar cliente Supabase com token do header Authorization
    const authHeader = request.headers.get('authorization');
    const { url, anonKey } = getPublicSupabaseConfig();
    const supabase = createClient<Database>(url, anonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
      auth: {
        persistSession: false,
      },
    });

    const repository = new EmpresaRepositoryImpl(supabase);
    const service = new EmpresaService(repository, supabase);
    const empresa = await service.findById(id);

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar acesso
    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, empresa.id) && !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    return NextResponse.json(empresa);
  } catch (error) {
    console.error('Error fetching empresa:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar empresa';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? errorStack : undefined },
      { status: 500 }
    );
  }
}

async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Criar cliente Supabase com token do header Authorization
    const authHeader = request.headers.get('authorization');
    const { url, anonKey } = getPublicSupabaseConfig();
    const supabase = createClient<Database>(url, anonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
      auth: {
        persistSession: false,
      },
    });

    const body = await request.json();
    const repository = new EmpresaRepositoryImpl(supabase);
    const service = new EmpresaService(repository, supabase);

    // Verificar acesso
    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas admin da empresa ou superadmin pode atualizar.' },
        { status: 403 }
      );
    }

    const empresa = await service.update(id, body);
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

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas superadmin pode deletar empresas.' },
        { status: 403 }
      );
    }

    const { url, anonKey } = getPublicSupabaseConfig();
    const supabase = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: false,
      },
    });

    const repository = new EmpresaRepositoryImpl(supabase);
    const service = new EmpresaService(repository, supabase);
    await service.delete(id);

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

// GET /api/empresas/[id] - Detalhes da empresa
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  return getHandler(request, context);
}

// PATCH /api/empresas/[id] - Atualizar empresa
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  return patchHandler(request, context);
}

// DELETE /api/empresas/[id] - Deletar empresa (apenas superadmin)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  return deleteHandler(request, context);
}
