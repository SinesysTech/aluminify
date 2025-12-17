import type { DashboardData } from '@/types/dashboard'
import { apiClient, ApiClientError } from '@/lib/api-client'
import type { HeatmapPeriod } from '@/components/dashboard/consistency-heatmap'

export interface DashboardServiceError extends Error {
  status?: number
  isNetworkError?: boolean
  isAuthError?: boolean
}

/**
 * Service layer para buscar dados do Dashboard Analytics
 * 
 * @param period - Período do heatmap: 'semanal', 'mensal' ou 'anual' (padrão: 'anual')
 * @returns Promise<DashboardData> - Dados completos do dashboard
 * @throws DashboardServiceError - Em caso de erro
 */
export async function fetchDashboardData(period: HeatmapPeriod = 'anual'): Promise<DashboardData> {
  try {
    const response = await apiClient.get<{ data: DashboardData }>(
      `/api/dashboard/analytics?period=${period}`
    )

    if (response && 'data' in response && response.data) {
      return response.data
    }

    throw new Error('Resposta da API não tem formato esperado')
  } catch (error) {
    if (error instanceof ApiClientError) {
      // Erro de autenticação - re-lançar erro
      if (error.status === 401 || error.status === 403) {
        const authError: DashboardServiceError = new Error(
          'Não autorizado. Faça login novamente.'
        )
        authError.status = error.status
        authError.isAuthError = true
        throw authError
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
      const serviceError: DashboardServiceError = new Error(
        error.message || 'Erro ao carregar dados do dashboard'
      )
      throw serviceError
    }

    throw new Error('Erro desconhecido ao carregar dados do dashboard')
  }
}

