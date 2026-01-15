import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { getPublicSupabaseConfig } from './supabase-public-env'

export function createClient() {
  const { url, anonKey } = getPublicSupabaseConfig()
  console.log('[DEBUG] createClient() - Supabase config:', {
    url,
    anonKeyPrefix: anonKey.substring(0, 20) + '...',
    anonKeyLength: anonKey.length
  })

  const wrappedFetch: typeof fetch = async (...args) => {
    try {
      return await fetch(...args)
    } catch (error) {
      // Ajuda a debugar "Failed to fetch" (DNS/CORS/bloqueio de extensão/proxy)
      const input = args[0] as unknown
      const requestUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : typeof input === 'object' && input && 'url' in input
              ? String((input as { url: string }).url)
              : undefined

      // Evitar logar headers/sensíveis. Só URL + erro.
      console.error('[Supabase] fetch falhou no navegador.', {
        requestUrl,
        supabaseUrlHost: (() => {
          try {
            return new URL(url).host
          } catch {
            return url
          }
        })(),
        message: error instanceof Error ? error.message : String(error),
      })

      throw error
    }
  }

  return createBrowserClient<Database>(
    url,
    anonKey,
    {
      global: {
        fetch: wrappedFetch,
      },
    }
  )
}
