import type { InstitutionDashboardData } from '@/types/dashboard-institution'
import { apiClient, ApiClientError } from '@/lib/api-client'

export interface InstitutionDashboardServiceError extends Error {
  status?: number
  isNetworkError?: boolean
  isAuthError?: boolean
}

type DashboardPeriod = 'semanal' | 'mensal' | 'anual'

/**
 * Service layer para buscar dados do Dashboard da Instituição
 *
 * @param period - Período do dashboard: 'semanal', 'mensal' ou 'anual' (padrão: 'mensal')
 * @returns Promise<InstitutionDashboardData> - Dados completos do dashboard
 * @throws InstitutionDashboardServiceError - Em caso de erro
 */
export async function fetchInstitutionDashboardData(
  period: DashboardPeriod = 'mensal'
): Promise<InstitutionDashboardData> {
  try {
    const response = await apiClient.get<{
      success: boolean
      data: InstitutionDashboardData
    }>(`/api/dashboard/institution?period=${period}`)

    if (response && response.success && response.data) {
      return response.data
    }

    throw new Error('Resposta da API não tem formato esperado')
  } catch (error) {
    if (error instanceof ApiClientError) {
      // Erro de autenticação
      if (error.status === 401 || error.status === 403) {
        const authError: InstitutionDashboardServiceError = new Error(
          'Não autorizado. Faça login novamente.'
        )
        authError.status = error.status
        authError.isAuthError = true
        throw authError
      }

      // Outros erros
      const serviceError: InstitutionDashboardServiceError = new Error(
        error.data?.error || error.message || 'Erro ao carregar dados do dashboard'
      )
      serviceError.status = error.status
      serviceError.isNetworkError = error.status >= 500
      throw serviceError
    }

    // Erro desconhecido
    if (error instanceof Error) {
      const serviceError: InstitutionDashboardServiceError = new Error(
        error.message || 'Erro ao carregar dados do dashboard'
      )
      throw serviceError
    }

    throw new Error('Erro desconhecido ao carregar dados do dashboard')
  }
}
