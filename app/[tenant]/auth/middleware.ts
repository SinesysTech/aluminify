import { NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { AuthUser, UserRole, ApiKeyAuth } from "./types";
import { apiKeyService } from "@/app/shared/core/services/api-key";
import { getImpersonationContext } from "@/app/shared/core/auth-impersonate";
import { getEffectiveEmpresaId } from "@/app/shared/core/effective-empresa";
import type {
  RoleTipo,
  RolePermissions,
} from "@/app/shared/types/entities/papel";

import { createClient } from "@/app/shared/core/server";
import { User } from "@supabase/supabase-js";

export type { AuthUser };
export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
  apiKey?: ApiKeyAuth;
  impersonationContext?: Awaited<ReturnType<typeof getImpersonationContext>>;
}


export async function mapSupabaseUserToAuthUser(
  user: User,
): Promise<AuthUser | null> {
  const client = getDatabaseClient();

  // Query usuarios_empresas for unified role determination
  const { data: vinculos, error: vinculoError } = await client
    .from("usuarios_empresas")
    .select("empresa_id, papel_base, papel_id, is_admin")
    .eq("usuario_id", user.id)
    .eq("ativo", true)
    .is("deleted_at", null);

  if (!vinculoError && vinculos && vinculos.length > 0) {
    // Prioritize staff roles (professor/usuario) over aluno
    const staffVinculo = vinculos.find(
      (v) => v.papel_base === "professor" || v.papel_base === "usuario",
    );
    const activeVinculo = staffVinculo || vinculos[0];

    if (
      activeVinculo.papel_base === "professor" ||
      activeVinculo.papel_base === "usuario"
    ) {
      // Staff role path
      let roleType: RoleTipo | undefined;
      let permissions: RolePermissions | undefined;

      if (activeVinculo.papel_id) {
        const { data: papelData } = await client
          .from("papeis")
          .select("tipo, permissoes")
          .eq("id", activeVinculo.papel_id)
          .maybeSingle();

        if (papelData) {
          roleType = papelData.tipo as RoleTipo;
          permissions = papelData.permissoes as unknown as RolePermissions;
        }
      }

      const isAdmin = activeVinculo.is_admin ?? false;

      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0];

      return {
        id: user.id,
        email: user.email!,
        role: "usuario",
        roleType,
        permissions,
        isAdmin,
        empresaId: activeVinculo.empresa_id,
        name,
      };
    }

    // Aluno role
    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0];
    return {
      id: user.id,
      email: user.email!,
      role: "aluno",
      isAdmin: false,
      empresaId: activeVinculo.empresa_id ?? undefined,
      name,
    };
  }

  // Fallback: user not found in usuarios_empresas, use metadata role
  const empresaId = user.user_metadata?.empresa_id as string | undefined;
  const metadataRole = user.user_metadata?.role as UserRole | undefined;
  const role: UserRole = metadataRole || "aluno";
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0];

  return {
    id: user.id,
    email: user.email!,
    role,
    isAdmin: false,
    empresaId,
    name,
  };
}

export async function getAuthUser(
  request: NextRequest,
): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get("authorization");
    let user = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // 1. Bearer Token Auth
      const token = authHeader.substring(7);
      const client = getDatabaseClient();
      const {
        data: { user: supabaseUser },
        error,
      } = await client.auth.getUser(token);

      if (!error && supabaseUser) {
        user = supabaseUser;
      } else {
        console.log(
          "[Auth] Error getting user from token:",
          error?.message || "No user found",
        );
      }
    } else {
      // 2. Cookie Auth (Fallback)
      const supabase = await createClient();
      const {
        data: { user: supabaseUser },
        error,
      } = await supabase.auth.getUser();

      if (!error && supabaseUser) {
        user = supabaseUser;
      }
    }

    if (!user) {
      return null;
    }

    return await mapSupabaseUserToAuthUser(user);
  } catch (err) {
    console.error("[Auth] Exception getting user:", err);
    return null;
  }
}

export async function getApiKeyAuth(
  request: NextRequest,
): Promise<ApiKeyAuth | null> {
  const apiKeyHeader = request.headers.get("x-api-key");

  if (!apiKeyHeader) {
    return null;
  }

  try {
    const apiKey = await apiKeyService.validateApiKey(apiKeyHeader);
    return {
      type: "api_key",
      apiKeyId: apiKey.id,
      createdBy: apiKey.createdBy,
    };
  } catch {
    return null;
  }
}

export async function getAuth(
  request: NextRequest,
): Promise<{ user: AuthUser } | { apiKey: ApiKeyAuth } | null> {
  // Tentar primeiro JWT, depois API Key
  const user = await getAuthUser(request);
  if (user) {
    return { user };
  }

  const apiKey = await getApiKeyAuth(request);
  if (apiKey) {
    return { apiKey };
  }

  return null;
}

export function requireAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
): (request: NextRequest) => Promise<NextResponse>;
export function requireAuth<TContext = unknown>(
  handler: (
    request: AuthenticatedRequest,
    context: TContext,
  ) => Promise<NextResponse>,
): (request: NextRequest, context: TContext) => Promise<NextResponse>;
export function requireAuth<TContext = unknown>(
  handler: (
    request: AuthenticatedRequest,
    context?: TContext,
  ) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context?: TContext) => {
    const auth = await getAuth(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    if ("user" in auth) {
      authenticatedRequest.user = auth.user;
      // Override empresaId with effective tenant (from x-tenant-id when user belongs to that tenant)
      const effectiveEmpresaId = await getEffectiveEmpresaId(
        request,
        auth.user,
      );
      if (effectiveEmpresaId) {
        authenticatedRequest.user = { ...auth.user, empresaId: effectiveEmpresaId };
      }
    } else {
      authenticatedRequest.apiKey = auth.apiKey;
    }

    // Unwrap params if it's a Promise (Next.js 16+)
    let unwrappedContext: unknown = context;
    if (
      context &&
      typeof context === "object" &&
      "params" in (context as Record<string, unknown>)
    ) {
      const record = context as Record<string, unknown>;
      const paramsValue = record.params;
      if (paramsValue instanceof Promise) {
        const params = await paramsValue;
        unwrappedContext = { ...record, params };
      }
    }

    return handler(authenticatedRequest, unwrappedContext as TContext);
  };
}

export function requireUserAuth(
  handler: (
    request: AuthenticatedRequest,
    context?: Record<string, unknown>,
  ) => Promise<NextResponse>,
) {
  return async (
    request: NextRequest,
    context?:
      | Record<string, unknown>
      | { params?: Promise<Record<string, string>> },
  ) => {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Override empresaId with effective tenant (from x-tenant-id when user belongs to that tenant)
    const effectiveEmpresaId = await getEffectiveEmpresaId(request, user);
    const userWithEffectiveEmpresa = effectiveEmpresaId
      ? { ...user, empresaId: effectiveEmpresaId }
      : user;

    // Verificar contexto de impersonação
    const impersonationContext = await getImpersonationContext();

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = userWithEffectiveEmpresa;
    if (impersonationContext && impersonationContext.realUserId === user.id) {
      authenticatedRequest.impersonationContext = impersonationContext;
    }

    // Unwrap params if it's a Promise (Next.js 16+)
    let unwrappedContext = context;
    if (context && "params" in context && context.params instanceof Promise) {
      const params = await context.params;
      unwrappedContext = { ...context, params };
    }

    return handler(authenticatedRequest, unwrappedContext);
  };
}

export function requireRole(role: UserRole) {
  return (
    handler: (
      request: AuthenticatedRequest,
      context?: Record<string, unknown>,
    ) => Promise<NextResponse>,
  ) => {
    return async (
      request: NextRequest,
      context?:
        | Record<string, unknown>
        | { params?: Promise<Record<string, string>> },
    ) => {
      const user = await getAuthUser(request);

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (user.role !== role) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;

      // Unwrap params if it's a Promise (Next.js 16+)
      let unwrappedContext = context;
      if (context && "params" in context && context.params instanceof Promise) {
        const params = await context.params;
        unwrappedContext = { ...context, params };
      }

      return handler(authenticatedRequest, unwrappedContext);
    };
  };
}

/**
 * Middleware that requires a specific permission to access a resource
 * @param resource - The resource name (e.g., "usuarios", "alunos")
 * @param action - The action (e.g., "view", "create", "edit", "delete")
 */
export function requirePermission(
  resource: keyof RolePermissions,
  action: "view" | "create" | "edit" | "delete",
) {
  return (
    handler: (
      request: AuthenticatedRequest,
      context?: Record<string, unknown>,
    ) => Promise<NextResponse>,
  ) => {
    return async (
      request: NextRequest,
      context?:
        | Record<string, unknown>
        | { params?: Promise<Record<string, string>> },
    ) => {
      const user = await getAuthUser(request);

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if user has the required permission
      const resourcePermissions = user.permissions?.[resource];
      if (!resourcePermissions) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const hasPermission = (resourcePermissions as Record<string, boolean>)[
        action
      ];
      if (!hasPermission) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;

      // Unwrap params if it's a Promise (Next.js 16+)
      let unwrappedContext = context;
      if (context && "params" in context && context.params instanceof Promise) {
        const params = await context.params;
        unwrappedContext = { ...context, params };
      }

      return handler(authenticatedRequest, unwrappedContext);
    };
  };
}
