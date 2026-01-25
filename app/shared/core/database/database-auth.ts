import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '@/app/[tenant]/auth/middleware';
import type { Database } from '@/lib/database.types';

let cachedClient: SupabaseClient<Database> | null = null;
let cachedServiceClient: SupabaseClient<Database> | null = null;

function getDatabaseCredentials() {
  const DATABASE_URL = process.env.SUPABASE_URL;
  const DATABASE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!DATABASE_URL || !DATABASE_KEY) {
    throw new Error(
      'Database credentials are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return { DATABASE_URL, DATABASE_KEY };
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
}

export function getDatabaseClient(): SupabaseClient<Database> {
  if (!cachedClient) {
    const { DATABASE_URL, DATABASE_KEY } = getDatabaseCredentials();
    cachedClient = createClient<Database>(DATABASE_URL, DATABASE_KEY, {
      auth: {
        persistSession: false,
      },
    });
  }
  return cachedClient;
}

export function getServiceRoleClient(): SupabaseClient<Database> {
  const SERVICE_ROLE_KEY = getServiceRoleKey();
  if (!SERVICE_ROLE_KEY) {
    throw new Error('Service role key is required for API key operations');
  }

  if (!cachedServiceClient) {
    const { DATABASE_URL } = getDatabaseCredentials();
    cachedServiceClient = createClient<Database>(DATABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
    });
  }
  return cachedServiceClient;
}

/**
 * Retorna o cliente do Supabase apropriado baseado no tipo de autenticação
 * - Se for autenticação via JWT (usuário), usa o cliente normal
 * - Se for autenticação via API Key, usa o service role client (bypass RLS)
 */
export function getAuthenticatedClient(request: AuthenticatedRequest): SupabaseClient<Database> {
  // Se for autenticação via API Key, usar service role para bypass RLS
  if (request.apiKey) {
    return getServiceRoleClient();
  }

  // Se for autenticação via JWT, usar cliente normal (respeita RLS)
  return getDatabaseClient();
}

