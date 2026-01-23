/**
 * Authentication Module
 *
 * Provides authentication utilities for the application including user retrieval,
 * role-based access control, and impersonation support.
 *
 * Key Functions:
 * - getAuthenticatedUser(): Get the current authenticated user with full context
 * - requireUser(): Enforce authentication and optionally check roles
 *
 * Type Safety Notes:
 * - This file uses type assertions for Supabase join queries (see inline comments)
 * - Nullable fields are handled with optional chaining (?.) and nullish coalescing (??)
 *
 * For detailed TypeScript patterns, see: docs/TYPESCRIPT_SUPABASE_GUIDE.md
 */

import { redirect } from "next/navigation";

import { createClient } from "@/lib/server";
import { getDatabaseClient } from "@/backend/clients/database";
import type { AppUser, AppUserRole } from "@/types/user";
import type { RoleTipo, RolePermissions } from "@/types/shared/entities/papel";
import { getDefaultRouteForRole } from "@/lib/roles";
import { getImpersonationContext } from "@/lib/auth-impersonate";

export async function getAuthenticatedUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Verificar se está em modo impersonação
  const impersonationContext = await getImpersonationContext();
  const isImpersonating =
    impersonationContext !== null &&
    impersonationContext.realUserId === user.id;

  // Se estiver impersonando, usar dados do usuário impersonado
  let targetUserId = user.id;
  if (isImpersonating && impersonationContext) {
    targetUserId = impersonationContext.impersonatedUserId;
  }

  // Get role from metadata
  const metadataRole =
    isImpersonating && impersonationContext
      ? impersonationContext.impersonatedUserRole
      : (user.user_metadata?.role as AppUserRole) || "aluno";

  let role: AppUserRole = metadataRole as AppUserRole;

  let mustChangePassword = Boolean(user.user_metadata?.must_change_password);
  let roleType: RoleTipo | undefined;
  let permissions: RolePermissions | undefined;

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[AUTH DEBUG] getAuthenticatedUser: base " +
        JSON.stringify({
          userId: user.id,
          email: user.email,
          role,
          isImpersonating,
          mustChangePasswordFromMetadata: Boolean(
            user.user_metadata?.must_change_password,
          ),
          metadataRole: user.user_metadata?.role,
          metadataEmpresaId: user.user_metadata?.empresa_id,
        }),
    );
  }

  let empresaId: string | undefined;
  let empresaNome: string | undefined;
  let empresaSlug: string | undefined;

  // Se estiver impersonando, buscar dados do aluno impersonado
  if (isImpersonating && impersonationContext) {
    const { data: alunoData } = await supabase
      .from("alunos")
      .select("must_change_password, nome_completo, email")
      .eq("id", targetUserId)
      .maybeSingle();

    if (alunoData) {
      return {
        id: targetUserId,
        email: alunoData.email || "",
        role: "aluno" as AppUserRole,
        fullName: alunoData.nome_completo || undefined,
        // Impersonação é uma visualização (read-only). Não devemos forçar troca de senha
        // do usuário impersonado, porque o usuário autenticado no Supabase Auth é o "real"
        // e isso pode causar loop em /primeiro-acesso para admins/professores.
        mustChangePassword: false,
        // Manter informações do usuário real para contexto
        _impersonationContext: impersonationContext,
      } as AppUser & { _impersonationContext?: typeof impersonationContext };
    }
  }

  // Load empresa context for usuarios (staff) and superadmin
  // First check if user exists in usuarios table (institution staff)
  // Note: Using service role client to bypass RLS for auth queries
  if (role === "usuario" || role === "superadmin") {
    // Use service role client to bypass RLS for authentication queries
    const adminClient = getDatabaseClient();

    // Query 1: Get usuario data
    const { data: usuarioRow, error: usuarioError } = await adminClient
      .from("usuarios")
      .select("empresa_id, nome_completo, papel_id")
      .eq("id", user.id)
      .eq("ativo", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (!usuarioError && usuarioRow) {
      // User found in usuarios table - they are institution staff
      role = "usuario";
      empresaId = usuarioRow.empresa_id;

      // Query 2: Get papel data
      if (usuarioRow.papel_id) {
        const { data: papelRow } = await adminClient
          .from("papeis")
          .select("tipo, permissoes")
          .eq("id", usuarioRow.papel_id)
          .maybeSingle();

        if (papelRow) {
          roleType = papelRow.tipo as RoleTipo;
          permissions = papelRow.permissoes as unknown as RolePermissions;
        }
      }

      // Query 3: Get empresa data
      if (usuarioRow.empresa_id) {
        const { data: empresaRow } = await adminClient
          .from("empresas")
          .select("nome, slug")
          .eq("id", usuarioRow.empresa_id)
          .maybeSingle();

        if (empresaRow) {
          empresaNome = empresaRow.nome ?? undefined;
          empresaSlug = empresaRow.slug ?? undefined;
        }
      }

      // Use nome_completo from usuarios table
      if (usuarioRow.nome_completo) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (user.user_metadata as any) = {
          ...(user.user_metadata || {}),
          full_name: usuarioRow.nome_completo,
        };
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          "[AUTH DEBUG] getAuthenticatedUser: usuario found " +
            JSON.stringify({
              userId: user.id,
              email: user.email,
              role,
              roleType,
              empresaId,
              empresaSlug,
            }),
        );
      }
    }
  }

  if (role === "aluno") {
    const { data: alunoData } = await supabase
      .from("alunos")
      .select("must_change_password")
      .eq("id", user.id)
      .maybeSingle();

    if (alunoData?.must_change_password !== undefined) {
      mustChangePassword = alunoData.must_change_password;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        "[AUTH DEBUG] getAuthenticatedUser: aluno mustChangePassword source " +
          JSON.stringify({
            userId: user.id,
            email: user.email,
            mustChangePasswordFromMetadata: Boolean(
              user.user_metadata?.must_change_password,
            ),
            alunoRowMustChangePassword: alunoData?.must_change_password,
            mustChangePasswordFinal: mustChangePassword,
          }),
      );
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[AUTH DEBUG] getAuthenticatedUser: non-aluno mustChangePassword final " +
          JSON.stringify({
            userId: user.id,
            email: user.email,
            role,
            mustChangePasswordFromMetadata: Boolean(
              user.user_metadata?.must_change_password,
            ),
            mustChangePasswordFinal: mustChangePassword,
          }),
      );
    }
  }

  return {
    id: targetUserId,
    email: user.email || "",
    role,
    roleType,
    permissions,
    fullName:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0],
    avatarUrl: user.user_metadata?.avatar_url,
    mustChangePassword,
    empresaId,
    empresaSlug,
    empresaNome,
    // Adicionar contexto de impersonação se estiver impersonando
    ...(isImpersonating && impersonationContext
      ? { _impersonationContext: impersonationContext }
      : {}),
  } as AppUser & { _impersonationContext?: typeof impersonationContext };
}

type RequireUserOptions = {
  ignorePasswordRequirement?: boolean;
};

export async function requireUser(
  options?: RequireUserOptions,
): Promise<AppUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth");
  }

  if (!options?.ignorePasswordRequirement && user.mustChangePassword) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[AUTH DEBUG] requireUser redirect /primeiro-acesso " +
          JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
          }),
      );
    }
    redirect("/primeiro-acesso");
  }

  return user;
}
