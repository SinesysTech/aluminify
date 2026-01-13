import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { getPublicSupabaseConfig } from './supabase-public-env'

export function createClient() {
  const { url, anonKey } = getPublicSupabaseConfig()

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

      console.error(message)
      // Mantém o erro original no console (stack/causa), sem vazar headers/chaves.
      console.error(error)

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
