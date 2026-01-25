import { NextResponse } from "next/server";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";
import { getDatabaseClient } from "@/backend/clients/database";
import { isAdminRoleTipo } from "@/lib/roles";
import type { RolePermissions } from "@/types/shared/entities/papel";

interface RouteContext {
  params: Promise<{ id: string; papelId: string }>;
}

/**
 * GET /api/empresas/[id]/papeis/[papelId]
 * Get a specific papel
 */
async function getHandler(
  request: AuthenticatedRequest,
  context?: RouteContext,
) {
  const { id: empresaId, papelId } = await context!.params;
  const user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user belongs to this empresa or is superadmin
  if (!user.isSuperAdmin && user.empresaId !== empresaId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = getDatabaseClient();

  const { data: papel, error } = await client
    .from("papeis")
    .select("*")
    .eq("id", papelId)
    .or(`empresa_id.is.null,empresa_id.eq.${empresaId}`)
    .single();

  if (error) {
    console.error("Error fetching papel:", error);
    return NextResponse.json({ error: "Papel not found" }, { status: 404 });
  }

  return NextResponse.json({ papel });
}

/**
 * PATCH /api/empresas/[id]/papeis/[papelId]
 * Update a custom papel
 */
async function patchHandler(
  request: AuthenticatedRequest,
  context?: RouteContext,
) {
  const { id: empresaId, papelId } = await context!.params;
  const user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can update papeis
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

  const client = getDatabaseClient();

  // First check if the papel exists and is not a system papel
  const { data: existingPapel, error: fetchError } = await client
    .from("papeis")
    .select("*")
    .eq("id", papelId)
    .single();

  if (fetchError || !existingPapel) {
    return NextResponse.json({ error: "Papel not found" }, { status: 404 });
  }

  if (existingPapel.is_system) {
    return NextResponse.json(
      { error: "Cannot update system papel" },
      { status: 403 },
    );
  }

  // Check if papel belongs to the empresa
  if (existingPapel.empresa_id !== empresaId) {
    return NextResponse.json(
      { error: "Papel does not belong to this empresa" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { nome, descricao, permissoes } = body as {
      nome?: string;
      descricao?: string;
      permissoes?: RolePermissions;
    };

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (permissoes !== undefined) updateData.permissoes = permissoes;

    const { data: papel, error } = await client
      .from("papeis")
      .update(updateData)
      .eq("id", papelId)
      .select()
      .single();

    if (error) {
      console.error("Error updating papel:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ papel });
  } catch (error) {
    console.error("Error parsing request:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

/**
 * DELETE /api/empresas/[id]/papeis/[papelId]
 * Delete a custom papel
 */
async function deleteHandler(
  request: AuthenticatedRequest,
  context?: RouteContext,
) {
  const { id: empresaId, papelId } = await context!.params;
  const user = request.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can delete papeis
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

  const client = getDatabaseClient();

  // First check if the papel exists and is not a system papel
  const { data: existingPapel, error: fetchError } = await client
    .from("papeis")
    .select("*")
    .eq("id", papelId)
    .single();

  if (fetchError || !existingPapel) {
    return NextResponse.json({ error: "Papel not found" }, { status: 404 });
  }

  if (existingPapel.is_system) {
    return NextResponse.json(
      { error: "Cannot delete system papel" },
      { status: 403 },
    );
  }

  // Check if papel belongs to the empresa
  if (existingPapel.empresa_id !== empresaId) {
    return NextResponse.json(
      { error: "Papel does not belong to this empresa" },
      { status: 403 },
    );
  }

  // Check if any usuarios are using this papel
  const { count, error: countError } = await client
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("papel_id", papelId)
    .is("deleted_at", null);

  if (countError) {
    console.error("Error checking usuarios:", countError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete papel: ${count} user(s) are still using it` },
      { status: 409 },
    );
  }

  // Delete the papel
  const { error } = await client.from("papeis").delete().eq("id", papelId);

  if (error) {
    console.error("Error deleting papel:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export const GET = requireAuth(getHandler);
export const PATCH = requireAuth(patchHandler);
export const DELETE = requireAuth(deleteHandler);
