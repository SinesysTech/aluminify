import type { ProfessorDashboardData } from "@/app/[tenant]/(dashboard)/dashboard/types";
import { apiClient, ApiClientError } from "@/app/shared/library/api-client";

export interface ProfessorDashboardServiceError extends Error {
  status?: number;
  isNetworkError?: boolean;
  isAuthError?: boolean;
  isForbidden?: boolean;
}

type DashboardPeriod = "semanal" | "mensal" | "anual";

/**
 * Service layer para buscar dados do Dashboard do Professor
 *
 * @param period - Período do dashboard: 'semanal', 'mensal' ou 'anual' (padrão: 'mensal')
 * @returns Promise<ProfessorDashboardData> - Dados completos do dashboard
 * @throws ProfessorDashboardServiceError - Em caso de erro
 */
export async function fetchProfessorDashboardData(
  period: DashboardPeriod = "mensal",
): Promise<ProfessorDashboardData> {
  try {
    const response = await apiClient.get<{
      success: boolean;
      data: ProfessorDashboardData;
    }>(`/api/dashboard/professor?period=${period}`);

    if (response && response.success && response.data) {
      return response.data;
    }

    throw new Error("Resposta da API não tem formato esperado");
  } catch (error) {
    if (error instanceof ApiClientError) {
      // Erro de autenticação (401) ou Permissão (403)
      if (error.status === 401 || error.status === 403) {
        const isForbidden = error.status === 403;

        const authError: ProfessorDashboardServiceError = new Error(
          isForbidden
            ? "Você não tem permissão para acessar este recurso."
            : "Não autorizado. Faça login novamente.",
        );
        authError.status = error.status;
        authError.isAuthError = error.status === 401;
        authError.isForbidden = isForbidden;
        throw authError;
      }

      // Outros erros
      const serviceError: ProfessorDashboardServiceError = new Error(
        error.data?.error ||
          error.message ||
          "Erro ao carregar dados do dashboard",
      );
      serviceError.status = error.status;
      serviceError.isNetworkError = error.status >= 500;
      throw serviceError;
    }

    // Erro desconhecido
    if (error instanceof Error) {
      const serviceError: ProfessorDashboardServiceError = new Error(
        error.message || "Erro ao carregar dados do dashboard",
      );
      throw serviceError;
    }

    throw new Error("Erro desconhecido ao carregar dados do dashboard");
  }
}
