import type { ProfessorDashboardData } from '@/types/dashboard-professor'
import { apiClient, ApiClientError } from '@/lib/api-client'

export interface ProfessorDashboardServiceError extends Error {
  status?: number
  isNetworkError?: boolean
  isAuthError?: boolean
}

/**
 * Service layer para buscar dados do Dashboard do Professor
 *
 * @returns Promise<ProfessorDashboardData> - Dados completos do dashboard
 * @throws ProfessorDashboardServiceError - Em caso de erro
 */
export async function fetchProfessorDashboardData(): Promise<ProfessorDashboardData> {
  try {
    const response = await apiClient.get<{
      success: boolean
      data: ProfessorDashboardData
    }>('/api/dashboard/professor')

    if (response && response.success && response.data) {
      return response.data
    }

    throw new Error('Resposta da API não tem formato esperado')
  } catch (error) {
    if (error instanceof ApiClientError) {
      // Erro de autenticação
      if (error.status === 401 || error.status === 403) {
        const authError: ProfessorDashboardServiceError = new Error(
          'Não autorizado. Faça login novamente.'
        )
        authError.status = error.status
        authError.isAuthError = true
        throw authError
      }

      // Outros erros
      const serviceError: ProfessorDashboardServiceError = new Error(
        error.data?.error || error.message || 'Erro ao carregar dados do dashboard'
      )
      serviceError.status = error.status
      serviceError.isNetworkError = error.status >= 500
      throw serviceError
    }

    // Erro desconhecido
    if (error instanceof Error) {
      const serviceError: ProfessorDashboardServiceError = new Error(
        error.message || 'Erro ao carregar dados do dashboard'
      )
      throw serviceError
    }

    throw new Error('Erro desconhecido ao carregar dados do dashboard')
  }
}
