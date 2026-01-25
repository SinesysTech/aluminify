'use client'

import { createClient } from '@/app/shared/core/client'

export interface ApiError {
  error: string
  details?: string
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: ApiError
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.warn('Error getting session:', error)
      return null
    }
    return session?.access_token || null
  } catch (error) {
    console.warn('Error in getAuthToken:', error)
    return null
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Log da requisição em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('API Request:', {
      endpoint,
      method: options.method || 'GET',
      hasToken: !!token,
    })
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorData: ApiError | undefined = undefined
    let errorText: string | undefined = undefined
    let rawResponse: unknown = undefined
    
    try {
      const contentType = response.headers.get('content-type') || ''
      const text = await response.text()
      
      // Log da resposta em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('API Error Response:', 
          `Status: ${response.status}`,
          `StatusText: ${response.statusText}`,
          `ContentType: ${contentType}`,
          `TextLength: ${text.length}`,
          `TextPreview: ${text.substring(0, 200)}`
        )
      }
      
      // Verificar se a resposta é HTML (página de erro do Next.js)
      if (contentType.includes('text/html') || text.trim().startsWith('<!DOCTYPE html>')) {
        // Tentar extrair mensagem de erro do JSON embutido no HTML
        const jsonMatch = text.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
        if (jsonMatch) {
          try {
            const nextData = JSON.parse(jsonMatch[1])
            const errorMessage = nextData?.props?.pageProps?.err?.message || 
                               nextData?.err?.message || 
                               'Erro interno do servidor'
            errorText = errorMessage
            // Criar errorData com a mensagem extraída
            errorData = { error: errorMessage }
          } catch {
            errorText = 'Erro interno do servidor. Verifique as configurações do banco de dados.'
            errorData = { error: errorText }
          }
        } else {
          errorText = 'Erro interno do servidor. Verifique as configurações do banco de dados.'
          errorData = { error: errorText }
        }
      } else if (contentType.includes('application/json') || text.trim().startsWith('{')) {
        try {
          rawResponse = JSON.parse(text)
          
          // Verificar se é um objeto vazio
          if (rawResponse && typeof rawResponse === 'object' && Object.keys(rawResponse).length === 0) {
            // Objeto vazio - criar mensagem baseada no status
            if (response.status === 401) {
              errorText = 'Não autorizado. Faça login novamente.'
            } else if (response.status === 403) {
              errorText = 'Acesso negado. Você precisa ser professor ou superadmin para realizar esta ação.'
            } else if (response.status === 500) {
              errorText = 'Erro interno do servidor. Verifique os logs do servidor para mais detalhes.'
            } else {
              errorText = `Erro do servidor (${response.status}). O servidor retornou uma resposta vazia.`
            }
            // Garantir que errorData seja sempre populado
            errorData = { error: errorText }
            if (process.env.NODE_ENV === 'development') {
              console.log('Detected empty object response, created errorData:', errorData)
            }
          }
          // Se tiver a propriedade 'error', usar diretamente
          else if (rawResponse && typeof rawResponse === 'object' && 'error' in rawResponse) {
            errorData = rawResponse as ApiError
            errorText = errorData.error
          }
          // Tentar extrair mensagem de erro de outras propriedades
          else if (rawResponse && typeof rawResponse === 'object') {
            const obj = rawResponse as Record<string, unknown>
            const extractedError = obj.message as string || obj.error as string || obj.details as string
            if (extractedError) {
              errorText = extractedError
              errorData = { error: extractedError }
            } else {
              // Se não conseguir extrair, usar o objeto completo como mensagem
              errorText = `Erro do servidor: ${JSON.stringify(rawResponse)}`
              errorData = { error: errorText }
            }
          } else {
            errorText = `Erro do servidor: ${JSON.stringify(rawResponse)}`
            errorData = { error: errorText }
          }
        } catch (parseError) {
          // Se não conseguir parsear como JSON, tratar como texto
          errorText = text || `Erro ao processar resposta do servidor: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
          errorData = { error: errorText }
        }
      } else {
        errorText = text || 'Erro desconhecido do servidor'
        errorData = { error: errorText }
      }
    } catch (parseError) {
      errorText = `Erro ao processar resposta: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      errorData = { error: errorText }
    }
    
    // Construir mensagem de erro mais informativa
    let errorMessage = errorData?.error || errorText
    
    if (!errorMessage) {
      // Se não tiver mensagem, tentar extrair do rawResponse
      if (rawResponse && typeof rawResponse === 'object') {
        const obj = rawResponse as Record<string, unknown>
        errorMessage = obj.message as string || 
                      obj.error as string || 
                      obj.details as string ||
                      (Object.keys(obj).length === 0 ? `Erro interno do servidor (${response.status}). Resposta vazia.` : JSON.stringify(rawResponse))
      } else if (rawResponse) {
        errorMessage = String(rawResponse)
      }
    }
    
    // Fallback final
    if (!errorMessage) {
      errorMessage = `HTTP error! status: ${response.status}${response.statusText ? ` - ${response.statusText}` : ''}`
    }
    
    // Garantir que sempre temos errorData com uma mensagem válida
    // IMPORTANTE: Sempre criar um novo objeto para garantir que errorData.error existe
    if (!errorData) {
      errorData = { error: errorMessage }
    } else if (!errorData.error || errorData.error === '') {
      errorData = { ...errorData, error: errorMessage }
    }
    
    // Verificação final de segurança
    if (!errorData || !errorData.error) {
      errorData = { error: errorMessage }
    }
    
    // Verificação final absoluta - garantir que errorData.error existe
    if (!errorData || typeof errorData !== 'object' || !('error' in errorData) || !errorData.error) {
      errorData = { error: errorMessage }
    }
    
    // Log detalhado do erro - evitar console.error em erros esperados (4xx),
    // porque o overlay do Next trata console.error como "Console Error".
    const errorLogData = {
      endpoint: String(endpoint),
      status: Number(response.status),
      statusText: String(response.statusText || ''),
      error: String(errorMessage || `HTTP ${response.status}`),
      errorData: errorData && typeof errorData === 'object' && 'error' in errorData 
        ? { error: String(errorData.error || errorMessage) }
        : { error: String(errorMessage || `HTTP ${response.status}`) },
      rawResponse: rawResponse && typeof rawResponse === 'object' && Object.keys(rawResponse).length === 0 
        ? '{} (objeto vazio)' 
        : rawResponse,
    }
    
    // Adicionar headers apenas em desenvolvimento para não expor informações sensíveis
    if (process.env.NODE_ENV === 'development') {
      (errorLogData as Record<string, unknown>).headers = Object.fromEntries(response.headers.entries())
    }
    
    const logFn = response.status >= 500 ? console.error : console.warn
    logFn('=== API Error ===')
    logFn('Endpoint:', errorLogData.endpoint)
    logFn('Status:', errorLogData.status, errorLogData.statusText)
    logFn('Error Message:', errorLogData.error)
    logFn('Error Data:', errorLogData.errorData)
    logFn('Raw Response:', errorLogData.rawResponse)
    if (process.env.NODE_ENV === 'development') {
      logFn('Full Error Data Object:', JSON.stringify(errorData, null, 2))
    }
    logFn('=================')

    throw new ApiClientError(
      errorMessage,
      response.status,
      errorData
    )
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    try {
      return await response.json() as T
    } catch {
      return {} as T
    }
  }
  
  const text = await response.text()
  return text as unknown as T
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'GET' })
  },

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  async delete<T>(endpoint: string): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'DELETE' })
  },
}

