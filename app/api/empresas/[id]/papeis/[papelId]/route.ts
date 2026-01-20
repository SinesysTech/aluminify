import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { PapelRepositoryImpl } from "@/backend/services/papel";
import { getAuthUser } from "@/backend/auth/middleware";
import {
  getEmpresaContext,
  validateEmpresaAccess,
} from "@/backend/middleware/empresa-context";
import type { UpdatePapelInput } from "@/types/shared/entities/papel";

interface RouteContext {
  params: Promise<{ id: string; papelId: string }>;
}

/**
 * GET /api/empresas/[id]/papeis/[papelId]
 * Busca um papel específico
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id, papelId } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const repository = new PapelRepositoryImpl(supabase);
    const papel = await repository.findById(papelId);

    if (!papel) {
      return NextResponse.json(
        { error: "Papel não encontrado" },
        { status: 404 }
      );
    }

    // Verify papel belongs to empresa or is a system role
    if (papel.empresaId !== null && papel.empresaId !== id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json(papel);
  } catch (error) {
    console.error("Error fetching papel:", error);
    return NextResponse.json(
      { error: "Erro ao buscar papel" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/empresas/[id]/papeis/[papelId]
 * Atualiza um papel customizado
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id, papelId } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Only admins can update roles
    if (!user.isSuperAdmin && !user.isAdmin) {
      return NextResponse.json(
        { error: "Apenas administradores podem atualizar papéis" },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const repository = new PapelRepositoryImpl(supabase);

    // Verify papel exists and belongs to empresa
    const existingPapel = await repository.findById(papelId);
    if (!existingPapel) {
      return NextResponse.json(
        { error: "Papel não encontrado" },
        { status: 404 }
      );
    }

    // Cannot update system roles
    if (existingPapel.isSystem) {
      return NextResponse.json(
        { error: "Não é possível atualizar papéis do sistema" },
        { status: 403 }
      );
    }

    // Verify papel belongs to empresa
    if (existingPapel.empresaId !== id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { nome, descricao, permissoes } = body;

    const input: UpdatePapelInput = {};
    if (nome !== undefined) input.nome = nome;
    if (descricao !== undefined) input.descricao = descricao;
    if (permissoes !== undefined) input.permissoes = permissoes;

    const papel = await repository.update(papelId, input);

    return NextResponse.json(papel);
  } catch (error) {
    console.error("Error updating papel:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao atualizar papel";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/empresas/[id]/papeis/[papelId]
 * Remove um papel customizado
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id, papelId } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Only admins can delete roles
    if (!user.isSuperAdmin && !user.isAdmin) {
      return NextResponse.json(
        { error: "Apenas administradores podem remover papéis" },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const repository = new PapelRepositoryImpl(supabase);

    // Verify papel exists and belongs to empresa
    const existingPapel = await repository.findById(papelId);
    if (!existingPapel) {
      return NextResponse.json(
        { error: "Papel não encontrado" },
        { status: 404 }
      );
    }

    // Cannot delete system roles
    if (existingPapel.isSystem) {
      return NextResponse.json(
        { error: "Não é possível remover papéis do sistema" },
        { status: 403 }
      );
    }

    // Verify papel belongs to empresa
    if (existingPapel.empresaId !== id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // TODO: Check if any usuarios are using this papel before deleting
    // For now, the database constraint will prevent deletion if in use

    await repository.delete(papelId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting papel:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao remover papel";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
