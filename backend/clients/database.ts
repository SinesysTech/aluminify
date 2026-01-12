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

function getDatabaseUserCredentials() {
  const DATABASE_URL = process.env.SUPABASE_URL;
  // Para operar com RLS, precisamos usar anon/publishable e um JWT do usuário
  const DATABASE_ANON_KEY =
    process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!DATABASE_URL || !DATABASE_ANON_KEY) {
    throw new Error(
      'Database user credentials are not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_PUBLISHABLE_KEY).',
    );
  }

  return { DATABASE_URL, DATABASE_ANON_KEY };
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

/**
 * Cria um client "user-scoped" (anon key + Bearer token).
 * Útil para rotas que dependem de RLS e de funções como get_user_empresa_id().
 *
 * Importante: não cachear este client globalmente (token varia por request).
 */
export function getDatabaseClientAsUser(accessToken: string): SupabaseClient {
  const token = accessToken?.trim();
  if (!token) {
    throw new Error('accessToken é obrigatório para getDatabaseClientAsUser');
  }

  const { DATABASE_URL, DATABASE_ANON_KEY } = getDatabaseUserCredentials();
  return createClient(DATABASE_URL, DATABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    db: {
      schema: 'public',
    },
  });
}

// Função para recriar o cliente (útil quando há mudanças no schema)
export function clearDatabaseClientCache(): void {
  cachedClient = null;
}

