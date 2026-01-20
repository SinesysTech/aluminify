import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/server";
import { PapelRepositoryImpl } from "@/backend/services/papel";
import { getAuthUser, requirePermission } from "@/backend/auth/middleware";
import {
  getEmpresaContext,
  validateEmpresaAccess,
} from "@/backend/middleware/empresa-context";
import type { CreatePapelInput } from "@/types/shared/entities/papel";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/empresas/[id]/papeis
 * Lista todos os papéis disponíveis para uma empresa (sistema + customizados)
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
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
    const papeis = await repository.listAvailableForEmpresa(id);

    return NextResponse.json(papeis);
  } catch (error) {
    console.error("Error listing papeis:", error);
    return NextResponse.json(
      { error: "Erro ao listar papéis" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/empresas/[id]/papeis
 * Cria um novo papel customizado para a empresa
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Only admins can create custom roles
    if (!user.isSuperAdmin && !user.isAdmin) {
      return NextResponse.json(
        { error: "Apenas administradores podem criar papéis customizados" },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { nome, tipo, descricao, permissoes } = body;

    if (!nome || !tipo || !permissoes) {
      return NextResponse.json(
        { error: "nome, tipo e permissoes são obrigatórios" },
        { status: 400 }
      );
    }

    const input: CreatePapelInput = {
      empresaId: id,
      nome,
      tipo,
      descricao,
      permissoes,
    };

    const repository = new PapelRepositoryImpl(supabase);
    const papel = await repository.create(input);

    return NextResponse.json(papel, { status: 201 });
  } catch (error) {
    console.error("Error creating papel:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao criar papel";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
