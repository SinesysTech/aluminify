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
import type { AppUser, AppUserRole } from "@/types/user";
import { getDefaultRouteForRole, hasRequiredRole } from "@/lib/roles";
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

  const role =
    isImpersonating && impersonationContext
      ? impersonationContext.impersonatedUserRole
      : (user.user_metadata?.role as AppUserRole) || "aluno";
  let mustChangePassword = Boolean(user.user_metadata?.must_change_password);

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
  let isEmpresaAdmin: boolean | undefined;

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
        mustChangePassword: alunoData.must_change_password || false,
        // Manter informações do usuário real para contexto
        _impersonationContext: impersonationContext,
      } as AppUser & { _impersonationContext?: typeof impersonationContext };
    }
  }

  // Ensure professor record exists if user is a professor
  // Note: This is a best-effort attempt. The handle_new_user() trigger should have created it,
  // but this ensures it exists even if the trigger didn't fire or if the user was created differently.
  if (role === "professor") {
    try {
      // Check if professor record exists
      const { data: existingProfessor, error: checkError } = await supabase
        .from("professores")
        .select("id, email")
        .eq("id", user.id)
        .maybeSingle();

      // Only proceed if we successfully checked (no error) and record doesn't exist
      if (!checkError && !existingProfessor) {
        const empresaId = user.user_metadata?.empresa_id as string | undefined;

        // Só tenta criar se tivermos uma empresa associada
        if (!empresaId) {
          return {
            id: user.id,
            email: user.email || "",
            role,
            fullName:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0],
            avatarUrl: user.user_metadata?.avatar_url,
            mustChangePassword,
          };
        }

        // Try to create the record, but don't fail if RLS blocks it
        // The trigger should have created it, so this is just a safety net
        const { error: insertError } = await supabase
          .from("professores")
          .insert({
            id: user.id,
            email: user.email || "",
            empresa_id: empresaId,
            nome_completo:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Novo Professor",
            is_admin: Boolean(user.user_metadata?.is_admin),
          });

        // Only log if there's an actual error (not just RLS blocking)
        // Most errors here are expected if RLS policy isn't set up yet
        if (insertError && insertError.code !== "42501") {
          // 42501 is permission denied - this is expected if policy doesn't exist yet
          console.debug(
            "Could not auto-create professor record (may need RLS policy):",
            {
              code: insertError.code,
              message: insertError.message,
            },
          );
        }
      } else if (
        !checkError &&
        existingProfessor &&
        existingProfessor.email !== user.email
      ) {
        // Update email if it has changed
        await supabase
          .from("professores")
          .update({ email: user.email || "" })
          .eq("id", user.id);
      }
    } catch (error) {
      // Silently ignore - this is a best-effort operation
      // The handle_new_user trigger should handle record creation
      if (process.env.NODE_ENV === "development") {
        console.debug("Error ensuring professor record (non-critical):", error);
      }
    }
  }

  // Carregar contexto de empresa para professor/superadmin (melhora navegação e guards)
  if (role === "professor" || role === "superadmin") {
    const { data: professorRow, error: professorError } = await supabase
      .from("professores")
      .select("empresa_id,is_admin,nome_completo,empresas(nome,slug)")
      .eq("id", user.id)
      .maybeSingle();

    if (!professorError && professorRow) {
      empresaId = professorRow.empresa_id ?? undefined;
      isEmpresaAdmin = Boolean(professorRow.is_admin);

      /**
       * Type Assertion for Join Query
       *
       * Why needed: Supabase's TypeScript client cannot automatically infer the structure
       * of joined data. The query `.select('empresa_id,is_admin,nome_completo,empresas(nome)')`
       * joins the professores table with the empresas table, but TypeScript doesn't know
       * the shape of the joined result.
       *
       * What we're asserting: The result includes an 'empresas' property that is either:
       * - An object with a 'nome' field (when the join finds a matching empresa)
       * - null (when there's no matching empresa or empresa_id is null)
       *
       * Safety: This assertion is safe because:
       * 1. The query explicitly requests 'empresas(nome)'
       * 2. We handle the null case with optional chaining (?.)
       * 3. The database schema guarantees empresa_id is a foreign key to empresas
       *
       * Alternative: We could use a generic type parameter on the select() call, but
       * type assertions are more explicit and easier to maintain for complex joins.
       *
       * For more information, see: docs/TYPESCRIPT_SUPABASE_GUIDE.md#type-assertions
       */
      type ProfessorWithEmpresa = {
        empresa_id: string | null;
        is_admin: boolean;
        nome_completo: string;
        empresas: { nome: string; slug: string } | null;
      };
      const typedRow = professorRow as unknown as ProfessorWithEmpresa;
      empresaNome = typedRow.empresas?.nome ?? undefined;

      // Se existir nome_completo, preferir como fullName
      if (professorRow.nome_completo) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (user.user_metadata as any) = {
          ...(user.user_metadata || {}),
          full_name: professorRow.nome_completo,
        };
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
    fullName:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0],
    avatarUrl: user.user_metadata?.avatar_url,
    mustChangePassword,
    empresaId,
    empresaSlug: empresaNome ? (professorRow as any).empresas?.slug : undefined,
    empresaNome,
    isEmpresaAdmin,
    // Adicionar contexto de impersonação se estiver impersonando
    ...(isImpersonating && impersonationContext
      ? { _impersonationContext: impersonationContext }
      : {}),
  } as AppUser & { _impersonationContext?: typeof impersonationContext };
}

type RequireUserOptions = {
  allowedRoles?: AppUserRole[];
  ignorePasswordRequirement?: boolean;
};

export async function requireUser(
  options?: RequireUserOptions,
): Promise<AppUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth");
  }

  if (
    options?.allowedRoles &&
    !hasRequiredRole(user.role, options.allowedRoles)
  ) {
    redirect(getDefaultRouteForRole(user.role));
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
