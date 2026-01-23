import { NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/backend/clients/database";
import { AuthUser, UserRole, ApiKeyAuth } from "./types";
import { apiKeyService } from "@/backend/services/api-key";
import { getImpersonationContext } from "@/lib/auth-impersonate";
import type { RoleTipo, RolePermissions } from "@/types/shared/entities/papel";

import { createClient } from "@/lib/server";
import { User } from "@supabase/supabase-js";

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
  apiKey?: ApiKeyAuth;
  impersonationContext?: Awaited<ReturnType<typeof getImpersonationContext>>;
}

import { isAdminRoleTipo } from "@/lib/roles";

export async function mapSupabaseUserToAuthUser(
  user: User,
): Promise<AuthUser | null> {
  const client = getDatabaseClient();

  // Check if user is superadmin from metadata
  const metadataRole = user.user_metadata?.role as UserRole | undefined;
  const isSuperAdmin =
    metadataRole === "superadmin" || user.user_metadata?.is_superadmin === true;

  if (isSuperAdmin) {
    return {
      id: user.id,
      email: user.email!,
      role: "superadmin",
      isSuperAdmin: true,
      isAdmin: true,
      empresaId: user.user_metadata?.empresa_id as string | undefined,
    };
  }

  // Check if user exists in usuarios table (institution staff)
  const { data: usuarioData, error: usuarioError } = await client
    .from("usuarios")
    .select("empresa_id, papeis!inner(tipo, permissoes)")
    .eq("id", user.id)
    .eq("ativo", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!usuarioError && usuarioData) {
    const papelData = usuarioData.papeis as {
      tipo: string;
      permissoes: unknown;
    };
    const roleType = papelData.tipo as RoleTipo;
    const permissions = papelData.permissoes as RolePermissions;
    const isAdmin = isAdminRoleTipo(roleType);

    return {
      id: user.id,
      email: user.email!,
      role: "usuario",
      roleType,
      permissions,
      isSuperAdmin: false,
      isAdmin,
      empresaId: usuarioData.empresa_id,
    };
  }

  // Check if user exists in alunos table
  const { data: alunoData, error: alunoError } = await client
    .from("alunos")
    .select("empresa_id")
    .eq("id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!alunoError && alunoData) {
    return {
      id: user.id,
      email: user.email!,
      role: "aluno",
      isSuperAdmin: false,
      isAdmin: false,
      empresaId: alunoData.empresa_id ?? undefined,
    };
  }

  // Fallback: user not found in any table, use metadata role
  const empresaId = user.user_metadata?.empresa_id as string | undefined;
  const role: UserRole = metadataRole || "aluno";

  return {
    id: user.id,
    email: user.email!,
    role,
    isSuperAdmin: false,
    isAdmin: false,
    empresaId,
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

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const client = getDatabaseClient();

  try {
    // Verificar metadata do usuário no auth
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user || user.id !== userId) {
      return false;
    }

    const role = user.user_metadata?.role as string | undefined;
    return role === "superadmin" || user.user_metadata?.is_superadmin === true;
  } catch {
    return false;
  }
}

export function requireAuth<TContext = Record<string, unknown>>(
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
    } else {
      authenticatedRequest.apiKey = auth.apiKey;
    }

    // Unwrap params if it's a Promise (Next.js 16+)
    let unwrappedContext = context;
    if (
      context &&
      typeof context === "object" &&
      "params" in context &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (context as any).params instanceof Promise
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params = await (context as any).params;
      unwrappedContext = { ...context, params } as TContext;
    }

    return handler(authenticatedRequest, unwrappedContext);
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

    // Verificar contexto de impersonação
    const impersonationContext = await getImpersonationContext();

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;
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

      if (user.role !== role && !user.isSuperAdmin) {
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

export function requireSuperAdmin(
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

    if (!user || !user.isSuperAdmin) {
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

      // SuperAdmins have all permissions
      if (user.isSuperAdmin) {
        const authenticatedRequest = request as AuthenticatedRequest;
        authenticatedRequest.user = user;

        let unwrappedContext = context;
        if (
          context &&
          "params" in context &&
          context.params instanceof Promise
        ) {
          const params = await context.params;
          unwrappedContext = { ...context, params };
        }

        return handler(authenticatedRequest, unwrappedContext);
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
