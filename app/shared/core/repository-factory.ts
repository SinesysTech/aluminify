/**
 * Repository Factory
 *
 * Creates repository instances with a user-scoped database client that
 * respects Row Level Security (RLS) policies. This ensures all database
 * operations are properly isolated to the user's tenant.
 *
 * Usage:
 * ```typescript
 * // In a server action or API route:
 * const { user, tenantId } = await requireTenantUser(slug);
 * const factory = await createRepositoryFactory();
 *
 * // Create repositories that respect RLS
 * const studentRepo = factory.create(StudentRepositoryImpl);
 * const cursoRepo = factory.create(CursoRepositoryImpl);
 * ```
 *
 * IMPORTANT: Always prefer this factory over manually calling getDatabaseClient()
 * for tenant-scoped operations. The service role client (getDatabaseClient)
 * bypasses RLS and should only be used for system-level operations.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/app/shared/core/server";
import {
  getDatabaseClientAsUser,
  getDatabaseClient,
} from "@/app/shared/core/database/database";
import type { Database } from "@/lib/database.types";

type RepositoryClass<T> = new (client: SupabaseClient<Database>) => T;

/**
 * Factory that creates repository instances with a user-scoped client.
 *
 * The client respects RLS policies, ensuring all queries are automatically
 * filtered by the user's tenant context.
 */
export class RepositoryFactory {
  constructor(private readonly client: SupabaseClient<Database>) {}

  /**
   * Create a repository instance with the user-scoped client.
   *
   * @param RepoClass - The repository implementation class
   * @returns An instance of the repository with RLS-scoped client
   *
   * @example
   * ```typescript
   * const factory = await createRepositoryFactory();
   * const studentRepo = factory.create(StudentRepositoryImpl);
   * const students = await studentRepo.list();
   * // ^ This query is automatically filtered by RLS policies
   * ```
   */
  create<T>(RepoClass: RepositoryClass<T>): T {
    return new RepoClass(this.client);
  }

  /**
   * Get the underlying user-scoped client.
   *
   * Use sparingly — prefer creating repositories via create() instead.
   * This is mainly useful for one-off queries or when no repository exists.
   */
  getClient(): SupabaseClient<Database> {
    return this.client;
  }
}

/**
 * Create a RepositoryFactory with a user-scoped client from the current
 * server-side authentication context (cookies/session).
 *
 * This is the preferred method for Next.js server components and server actions.
 *
 * @returns A RepositoryFactory configured with the current user's RLS context
 * @throws {Error} If no authenticated session is found
 *
 * @example
 * ```typescript
 * // In a server action:
 * export async function listStudents() {
 *   const factory = await createRepositoryFactory();
 *   const studentRepo = factory.create(StudentRepositoryImpl);
 *   return studentRepo.list();
 * }
 * ```
 */
export async function createRepositoryFactory(): Promise<RepositoryFactory> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      "No authenticated session found. Cannot create user-scoped repository factory.",
    );
  }

  const client = getDatabaseClientAsUser(session.access_token);
  return new RepositoryFactory(client);
}

/**
 * Create a RepositoryFactory from an explicit access token.
 *
 * Use this in API routes where you have the token from the Authorization header.
 *
 * @param accessToken - The user's JWT access token
 * @returns A RepositoryFactory configured with the user's RLS context
 *
 * @example
 * ```typescript
 * // In an API route:
 * export async function GET(request: Request) {
 *   const token = request.headers.get('Authorization')?.replace('Bearer ', '');
 *   const factory = createRepositoryFactoryFromToken(token!);
 *   const cursoRepo = factory.create(CursoRepositoryImpl);
 *   return Response.json(await cursoRepo.list());
 * }
 * ```
 */
export function createRepositoryFactoryFromToken(
  accessToken: string,
): RepositoryFactory {
  const client = getDatabaseClientAsUser(accessToken);
  return new RepositoryFactory(client);
}

/**
 * Create a RepositoryFactory with the service role client.
 *
 * WARNING: This bypasses RLS policies. Only use for system-level operations
 * such as cron jobs, webhooks, or admin tasks that need cross-tenant access.
 *
 * @returns A RepositoryFactory configured with service role permissions
 */
export function createServiceRepositoryFactory(): RepositoryFactory {
  const client = getDatabaseClient();
  return new RepositoryFactory(client);
}
