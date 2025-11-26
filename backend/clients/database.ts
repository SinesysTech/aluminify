import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

function getDatabaseCredentials() {
  const DATABASE_URL = process.env.SUPABASE_URL;
  // Prioriza as novas chaves (sb_secret_... ou sb_publishable_...), depois as antigas para compatibilidade
  const DATABASE_KEY =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY;

  if (!DATABASE_URL || !DATABASE_KEY) {
    throw new Error(
      'Database credentials are not configured. Set SUPABASE_URL and either SUPABASE_SECRET_KEY (recommended) or SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return { DATABASE_URL, DATABASE_KEY };
}

export function getDatabaseClient(): SupabaseClient {
  if (!cachedClient) {
    const { DATABASE_URL, DATABASE_KEY } = getDatabaseCredentials();
    cachedClient = createClient(DATABASE_URL, DATABASE_KEY, {
      auth: {
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    });
  }
  return cachedClient;
}

// Função para recriar o cliente (útil quando há mudanças no schema)
export function clearDatabaseClientCache(): void {
  cachedClient = null;
}

