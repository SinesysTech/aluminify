import { NextResponse } from "next/server";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";
import { getDatabaseClient } from "@/backend/clients/database";
import { isAdminRoleTipo } from "@/app/shared/core/roles";
import type { Database } from "@/app/shared/core/database.types";
import type { RolePermissions, RoleTipo } from "@/types/shared/entities/papel";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/empresas/[id]/papeis
 * List all available papéis for an empresa (system + custom)
 */
async function getHandler(
  request: AuthenticatedRequest,
  context?: RouteContext,
) {
  const { id: empresaId } = await context!.params;
  const user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user belongs to this empresa or is superadmin
  if (!user.isSuperAdmin && user.empresaId !== empresaId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = getDatabaseClient();

  const { data: papeis, error } = await client
    .from("papeis")
    .select("*")
    .or(`empresa_id.is.null,empresa_id.eq.${empresaId}`)
    .order("is_system", { ascending: false })
    .order("nome");

  if (error) {
    console.error("Error fetching papeis:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ papeis });
}

/**
 * POST /api/empresas/[id]/papeis
 * Create a custom papel for an empresa
 */
async function postHandler(
  request: AuthenticatedRequest,
  context?: RouteContext,
) {
  const { id: empresaId } = await context!.params;
  const user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can create papeis
  const isAdmin =
    user.isSuperAdmin || (user.roleType && isAdminRoleTipo(user.roleType));
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Admin privileges required" },
      { status: 403 },
    );
  }

  // Check if user belongs to this empresa or is superadmin
  if (!user.isSuperAdmin && user.empresaId !== empresaId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { nome, tipo, descricao, permissoes } = body as {
      nome: string;
      tipo: RoleTipo;
      descricao?: string;
      permissoes: RolePermissions;
    };

    // Validate required fields
    if (!nome || !tipo || !permissoes) {
      return NextResponse.json(
        { error: "Nome, tipo and permissoes are required" },
        { status: 400 },
      );
    }

    const client = getDatabaseClient();

    type PapelInsert = Database["public"]["Tables"]["papeis"]["Insert"];
    const insertData: PapelInsert = {
      nome,
      descricao: descricao ?? null,
      permissoes: permissoes as unknown as PapelInsert["permissoes"],
      tipo: "custom",
      empresa_id: empresaId,
      is_system: false,
    };

    const { data: papel, error } = await client
      .from("papeis")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating papel:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ papel }, { status: 201 });
  } catch (error) {
    console.error("Error parsing request:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);
