import type { DashboardData } from '@/types/dashboard'
import { apiClient, ApiClientError } from '@/lib/api-client'
import { dashboardMockData } from '@/lib/mock/dashboardMockData'
import type { HeatmapPeriod } from '@/components/dashboard/consistency-heatmap'

export interface DashboardServiceError extends Error {
  status?: number
  isNetworkError?: boolean
  isAuthError?: boolean
}

/**
 * Service layer para buscar dados do Dashboard Analytics
 * 
 * Tenta buscar dados da API real. Em caso de erro, retorna dados mock como fallback.
 * 
 * @param period - Período do heatmap: 'semanal', 'mensal' ou 'anual' (padrão: 'anual')
 * @returns Promise<DashboardData> - Dados completos do dashboard
 * @throws DashboardServiceError - Em caso de erro crítico
 */
export async function fetchDashboardData(period: HeatmapPeriod = 'anual'): Promise<DashboardData> {
  try {
    // Tentar buscar dados da API real
    const response = await apiClient.get<{ data: DashboardData }>(
      `/api/dashboard/analytics?period=${period}`
    )

    if (response && 'data' in response && response.data) {
      return response.data
    }

    // Se a resposta não tiver o formato esperado, usar fallback
    console.warn(
      'Resposta da API não tem formato esperado, usando dados mock como fallback'
    )
    return dashboardMockData
  } catch (error) {
    // Tratamento de erros específicos
    if (error instanceof ApiClientError) {
      // Erro de autenticação - não usar fallback, re-lançar erro
      if (error.status === 401 || error.status === 403) {
        const authError: DashboardServiceError = new Error(
          'Não autorizado. Faça login novamente.'
        )
        authError.status = error.status
        authError.isAuthError = true
        throw authError
      }

      // Erro de rede ou servidor - usar fallback em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `Erro ao buscar dados do dashboard (${error.status}), usando dados mock:`,
          error.message
        )
        return dashboardMockData
      }

      // Em produção, re-lançar erro para tratamento no componente
      const serviceError: DashboardServiceError = new Error(
        error.data?.error || error.message || 'Erro ao carregar dados do dashboard'
      )
      serviceError.status = error.status
      serviceError.isNetworkError = error.status >= 500
      throw serviceError
    }

    // Erro desconhecido
    if (error instanceof Error) {
      // Em desenvolvimento, usar fallback
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'Erro desconhecido ao buscar dados do dashboard, usando dados mock:',
          error.message
        )
        return dashboardMockData
      }

      // Em produção, re-lançar
      const serviceError: DashboardServiceError = new Error(
        error.message || 'Erro ao carregar dados do dashboard'
      )
      throw serviceError
    }

    // Fallback final
    if (process.env.NODE_ENV === 'development') {
      console.warn('Erro desconhecido, usando dados mock como fallback')
      return dashboardMockData
    }

    throw new Error('Erro desconhecido ao carregar dados do dashboard')
  }
}

