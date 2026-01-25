import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { getPublicSupabaseConfig } from './supabase-public-env'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Evita flood no console quando o auth-js tenta refresh/retry.
const SUPABASE_FETCH_LOG_THROTTLE_MS = 5_000
const supabaseFetchLogLastAt = new Map<string, number>()

export function createClient() {
  // No browser, reutilize um único client para evitar múltiplos auto-refresh concorrendo.
  if (typeof window !== 'undefined' && browserClient) {
    return browserClient
  }

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

      const pageOrigin =
        typeof window !== 'undefined' && typeof window.location !== 'undefined'
          ? window.location.origin
          : undefined

      const online =
        typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
          ? navigator.onLine
          : undefined

      const supabaseOrigin = (() => {
        try {
          const u = new URL(url)
          return `${u.protocol}//${u.host}`
        } catch {
          return url
        }
      })()

      const hints: string[] = []
      try {
        if (requestUrl) {
          const req = new URL(requestUrl, pageOrigin ?? undefined)
          if (pageOrigin && req.protocol === 'http:' && pageOrigin.startsWith('https:')) {
            hints.push('mixed-content (página https chamando recurso http)')
          }
        }
      } catch {
        // Ignore: requestUrl pode ser relativo/estranho; não queremos falhar o log
      }
      if (online === false) hints.push('navegador offline')
      if (!hints.length) {
        hints.push('possível bloqueio por extensão/proxy/firewall/DNS, ou erro de CORS/CSP')
      }

      // Evitar logar headers/sensíveis. Só URL + erro.
      const message = [
        '[Supabase] fetch falhou no navegador.',
        requestUrl ? `requestUrl=${requestUrl}` : 'requestUrl=(indisponível)',
        pageOrigin ? `pageOrigin=${pageOrigin}` : 'pageOrigin=(indisponível)',
        `supabaseOrigin=${supabaseOrigin}`,
        typeof online === 'boolean' ? `online=${online}` : 'online=(indisponível)',
        `hints=${hints.join(' | ')}`,
        `error=${error instanceof Error ? error.message : String(error)}`,
      ].join(' ')

      const key = `${requestUrl ?? 'requestUrl=(indisponível)'}|${error instanceof Error ? error.message : String(error)}`
      const now = Date.now()
      const last = supabaseFetchLogLastAt.get(key) ?? 0
      const shouldLog = now - last >= SUPABASE_FETCH_LOG_THROTTLE_MS
      if (shouldLog) {
        supabaseFetchLogLastAt.set(key, now)
        // Se o navegador estiver offline, isso é esperado — não tratar como erro “alto”.
        if (online === false) {
          console.warn(message)
        } else {
          console.error(message)
          // Mantém o erro original no console (stack/causa), sem vazar headers/chaves.
          console.error(error)
        }
      }

      // Evitar "TypeError: Failed to fetch" estourando como exceção não tratada.
      // Em vez de lançar, retornamos uma Response 503 para que o Supabase consiga
      // tratar como erro HTTP (mais fácil de capturar/mostrar no UI).
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          requestUrl: requestUrl ?? null,
          online: typeof online === 'boolean' ? online : null,
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    }
  }

  const client = createBrowserClient<Database>(
    url,
    anonKey,
    {
      global: {
        fetch: wrappedFetch,
      },
    }
  )

  if (typeof window !== 'undefined') {
    browserClient = client
  }

  return client
}
