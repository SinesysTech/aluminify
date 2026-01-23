/**
 * DTOs padronizados para respostas de API
 */

export interface ApiResponse<T> {
  data: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  query?: string;
  courseId?: string;
  turmaId?: string;
}
