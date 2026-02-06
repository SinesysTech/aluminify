"use server";

import { getAuthenticatedUser } from "@/app/shared/core/auth";
import { isTeachingRole } from "@/app/shared/core/roles";
import { getDatabaseClient } from "@/app/shared/core/database/database";

/**
 * Verifica se o usuário logado pode gerenciar a agenda de um professor.
 * Retorna true se:
 * - O usuário É o professor (self)
 * - Ou o usuário é admin da mesma empresa do professor
 *
 * Lança erro se não autenticado.
 */
export async function canManageProfessorSchedule(
  professorId: string,
): Promise<boolean> {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  // Self - always allowed
  if (user.id === professorId) return true;

  // Check if user is admin
  if (!user.isAdmin) return false;
  if (!user.empresaId) return false;

  // Verify target professor is in the same empresa
  const adminClient = getDatabaseClient();
  const { data: targetUser } = await adminClient
    .from("usuarios")
    .select("empresa_id")
    .eq("id", professorId)
    .eq("ativo", true)
    .is("deleted_at", null)
    .single();

  if (!targetUser || targetUser.empresa_id !== user.empresaId) return false;

  return true;
}

/**
 * Verifica se o usuário logado é admin e retorna seus dados.
 * Retorna null se não for admin.
 */
export async function getAdminContext() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  return {
    userId: user.id,
    empresaId: user.empresaId,
    isAdmin: user.isAdmin,
    isTeacher: isTeachingRole(user.role),
    roleType: user.roleType, // deprecated, kept for compatibility
  };
}

interface ProfessorOption {
  id: string;
  fullName: string;
}

/**
 * Retorna a lista de professores (com papel de ensino) da empresa.
 * Para uso no seletor de admin.
 */
export async function getTeachersForAdminSelector(
  empresaId: string,
): Promise<ProfessorOption[]> {
  const user = await getAuthenticatedUser();

  if (!user) {
    console.error(
      "Unauthorized access attempt to getTeachersForAdminSelector: No user",
    );
    throw new Error("Unauthorized");
  }

  // Ensure user is admin
  if (!user.isAdmin) {
    console.error(
      `Unauthorized access attempt to getTeachersForAdminSelector: User ${user.id} is not admin`,
    );
    throw new Error("Unauthorized");
  }

  // Ensure user belongs to the requested empresa
  if (user.empresaId !== empresaId) {
    console.error(
      `Cross-tenant access attempt to getTeachersForAdminSelector: User ${user.id} (empresa: ${user.empresaId}) requested empresa ${empresaId}`,
    );
    throw new Error("Unauthorized");
  }

  const adminClient = getDatabaseClient();

  // Explicitly filter by empresa_id again just to be safe, although we checked user.empresaId === empresaId
  const { data, error } = await adminClient
    .from("usuarios")
    .select("id, nome_completo, papel_id, papeis!inner(tipo)")
    .eq("empresa_id", empresaId)
    .eq("ativo", true)
    .is("deleted_at", null)
    .in("papeis.tipo", ["professor", "professor_admin", "monitor"])
    .order("nome_completo", { ascending: true });

  if (error) {
    console.error("Error fetching teachers for admin selector:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    fullName: row.nome_completo || row.id,
  }));
}
