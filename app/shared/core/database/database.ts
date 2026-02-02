/**
 * Database Client Module
 *
 * Provides typed Supabase client instances for database operations.
 *
 * Key Functions:
 * - getDatabaseClient(): Server-side client with service role permissions
 * - getDatabaseClientAsUser(token): User-scoped client that respects RLS policies
 *
 * Usage Examples:
 * ```typescript
 * // Server-side operations (bypasses RLS)
 * const client = getDatabaseClient();
 * const { data } = await client.from('usuarios').select('*');
 *
 * // User-scoped operations (respects RLS)
 * const client = getDatabaseClientAsUser(accessToken);
 * const { data } = await client.from('usuarios').select('*');
 * ```
 *
 * For detailed documentation, see: docs/TYPESCRIPT_SUPABASE_GUIDE.md
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { env } from "@/app/shared/core/env";

let cachedClient: SupabaseClient<Database> | null = null;

function getDatabaseCredentials() {
  const DATABASE_URL = env.SUPABASE_URL;
  // Prioriza as novas chaves (sb_secret_... ou sb_publishable_...), depois as antigas para compatibilidade
  const DATABASE_KEY =
    env.SUPABASE_SECRET_KEY ??
    env.SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_PUBLISHABLE_KEY ??
    env.SUPABASE_ANON_KEY;

  if (!DATABASE_KEY) {
    throw new Error(
      "Database credentials are not configured properly (missing keys).",
    );
  }

  return { DATABASE_URL, DATABASE_KEY };
}

function getDatabaseUserCredentials() {
  const DATABASE_URL = env.SUPABASE_URL;
  /**
   * User-scoped clients MUST use public keys (anon/publishable) so that
   * Row Level Security (RLS) is enforced. Service role keys bypass RLS
   * entirely and must NEVER be used here.
   */
  const DATABASE_API_KEY =
    env.SUPABASE_ANON_KEY ??
    env.SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!DATABASE_API_KEY) {
    throw new Error(
      "User-scoped database client requires a public key " +
        "(SUPABASE_ANON_KEY, SUPABASE_PUBLISHABLE_KEY, or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY). " +
        "Service role keys (SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY) " +
        "must NOT be used for user-scoped clients as they bypass RLS and tenant isolation.",
    );
  }

  return { DATABASE_URL, DATABASE_API_KEY };
}

/**
 * Get a server-side Supabase client with service role permissions.
 *
 * This client bypasses Row Level Security (RLS) policies and should only be used
 * for server-side operations that require elevated permissions.
 *
 * The client is cached globally for performance.
 *
 * @returns {SupabaseClient<Database>} Typed Supabase client instance
 * @throws {Error} If database credentials are not configured
 *
 * @example
 * ```typescript
 * const client = getDatabaseClient();
 * const { data, error } = await client
 *   .from('usuarios')
 *   .select('*')
 *   .eq('empresa_id', empresaId);
 * ```
 */
export function getDatabaseClient(): SupabaseClient<Database> {
  if (!cachedClient) {
    const { DATABASE_URL, DATABASE_KEY } = getDatabaseCredentials();
    cachedClient = createClient<Database>(DATABASE_URL, DATABASE_KEY, {
      auth: {
        persistSession: false,
      },
      db: {
        schema: "public",
      },
    });
  }
  return cachedClient;
}

/**
 * Create a user-scoped Supabase client that respects Row Level Security (RLS).
 *
 * This client uses the user's access token to enforce RLS policies and database functions
 * like get_user_empresa_id() that depend on the authenticated user context.
 *
 * ⚠️ Important: Do NOT cache this client globally as the token varies per request.
 *
 * @param {string} accessToken - User's JWT access token from authentication
 * @returns {SupabaseClient<Database>} Typed Supabase client instance with user context
 * @throws {Error} If accessToken is missing or empty
 *
 * @example
 * ```typescript
 * // In an API route
 * const token = request.headers.get('Authorization')?.replace('Bearer ', '');
 * const client = getDatabaseClientAsUser(token);
 *
 * // This query respects RLS policies for the authenticated user
 * const { data, error } = await client
 *   .from('usuarios')
 *   .select('*')
 *   .eq('id', userId);
 * ```
 */
export function getDatabaseClientAsUser(
  accessToken: string,
): SupabaseClient<Database> {
  const token = accessToken?.trim();
  if (!token) {
    throw new Error("accessToken é obrigatório para getDatabaseClientAsUser");
  }

  const { DATABASE_URL, DATABASE_API_KEY } = getDatabaseUserCredentials();
  return createClient<Database>(DATABASE_URL, DATABASE_API_KEY, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    db: {
      schema: "public",
    },
  });
}

/**
 * Clear the cached database client.
 *
 * Useful when schema changes require a fresh client instance.
 * The next call to getDatabaseClient() will create a new client.
 *
 * @example
 * ```typescript
 * // After regenerating database types
 * clearDatabaseClientCache();
 * const client = getDatabaseClient(); // Creates new client with updated types
 * ```
 */
export function clearDatabaseClientCache(): void {
  cachedClient = null;
}
