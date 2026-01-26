import type {
  DashboardData,
  DashboardGroupBy,
  DashboardPeriod,
  DashboardScopeLevel,
  PerformanceItem,
  StrategicDomainResponse,
  SubjectDistributionResponse,
} from "../../types";
import { apiClient, ApiClientError } from "@/app/shared/library/api-client";
import type { HeatmapPeriod } from "../../components/consistency-heatmap";

export interface DashboardServiceError extends Error {
  status?: number;
  isNetworkError?: boolean;
  isAuthError?: boolean;
}

export interface FetchDashboardDataOptions {
  period?: HeatmapPeriod;
  /** Filter by organization ID (for multi-org students) */
  empresaId?: string | null;
}

/**
 * Service layer para buscar dados do Dashboard Analytics
 *
 * @param periodOrOptions - Período do heatmap ou objeto de opções
 * @returns Promise<DashboardData> - Dados completos do dashboard
 * @throws DashboardServiceError - Em caso de erro
 */
export async function fetchDashboardData(
  periodOrOptions: HeatmapPeriod | FetchDashboardDataOptions = "anual",
): Promise<DashboardData> {
  // Normalize options
  const options: FetchDashboardDataOptions =
    typeof periodOrOptions === "string"
      ? { period: periodOrOptions }
      : periodOrOptions;

  const period = options.period ?? "anual";
  const empresaId = options.empresaId;

  try {
    const params = new URLSearchParams({ period });
    if (empresaId) {
      params.set("empresa_id", empresaId);
    }

    const response = await apiClient.get<{ data: DashboardData }>(
      `/api/dashboard/analytics?${params.toString()}`,
    );

    if (response && "data" in response && response.data) {
      return response.data;
    }

    throw new Error("Resposta da API não tem formato esperado");
  } catch (error) {
    if (error instanceof ApiClientError) {
      // Erro de autenticação - re-lançar erro
      if (error.status === 401 || error.status === 403) {
        const authError: DashboardServiceError = new Error(
          "Não autorizado. Faça login novamente.",
        );
        authError.status = error.status;
        authError.isAuthError = true;
        throw authError;
      }

      // Em produção, re-lançar erro para tratamento no componente
      const serviceError: DashboardServiceError = new Error(
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
      const serviceError: DashboardServiceError = new Error(
        error.message || "Erro ao carregar dados do dashboard",
      );
      throw serviceError;
    }

    throw new Error("Erro desconhecido ao carregar dados do dashboard");
  }
}

export interface DashboardCourse {
  id: string;
  nome: string;
  empresa_id: string | null;
  empresaNome: string | null;
  empresaLogoUrl: string | null;
}

export async function fetchDashboardCourses(): Promise<DashboardCourse[]> {
  const response = await apiClient.get<{ data: DashboardCourse[] }>(
    `/api/dashboard/courses`,
  );
  return response.data ?? [];
}

export async function fetchSubjectDistribution(params: {
  groupBy: DashboardGroupBy;
  scope: DashboardScopeLevel;
  scopeId?: string;
  period?: DashboardPeriod;
}): Promise<SubjectDistributionResponse> {
  const period = params.period ?? "mensal";
  const qs = new URLSearchParams({
    group_by: params.groupBy,
    scope: params.scope,
    ...(params.scopeId ? { scope_id: params.scopeId } : {}),
    period,
  });
  const response = await apiClient.get<{ data: SubjectDistributionResponse }>(
    `/api/dashboard/subject-distribution?${qs.toString()}`,
  );
  return response.data;
}

export async function fetchPerformance(params: {
  groupBy: DashboardGroupBy;
  scope: DashboardScopeLevel;
  scopeId?: string;
  period?: DashboardPeriod;
}): Promise<PerformanceItem[]> {
  const qs = new URLSearchParams({
    group_by: params.groupBy,
    scope: params.scope,
    ...(params.scopeId ? { scope_id: params.scopeId } : {}),
    ...(params.period ? { period: params.period } : {}),
  });
  const response = await apiClient.get<{ data: PerformanceItem[] }>(
    `/api/dashboard/performance?${qs.toString()}`,
  );
  return response.data ?? [];
}

export async function fetchStrategicDomain(params: {
  scope: DashboardScopeLevel;
  scopeId?: string;
  period?: DashboardPeriod;
}): Promise<StrategicDomainResponse> {
  const qs = new URLSearchParams({
    scope: params.scope,
    ...(params.scopeId ? { scope_id: params.scopeId } : {}),
    ...(params.period ? { period: params.period } : {}),
  });
  const response = await apiClient.get<{ data: StrategicDomainResponse }>(
    `/api/dashboard/strategic-domain?${qs.toString()}`,
  );
  return response.data;
}
