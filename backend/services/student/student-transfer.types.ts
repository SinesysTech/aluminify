/**
 * Types for bulk student transfer operations
 */

export type TurmaStatus = 'ativo' | 'concluido' | 'cancelado' | 'trancado';

export interface TransferOptions {
  preserveEnrollmentDates?: boolean;
  updateMatriculas?: boolean;
}

export interface TransferResult {
  studentId: string;
  studentName: string | null;
  status: 'success' | 'failed' | 'skipped';
  message?: string;
}

export interface BulkTransferResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  results: TransferResult[];
}

export interface BulkTransferCourseRequest {
  studentIds: string[];
  sourceCourseId: string;
  targetCourseId: string;
  options?: TransferOptions;
}

export interface BulkTransferTurmaRequest {
  studentIds: string[];
  sourceTurmaId: string;
  targetTurmaId: string;
  sourceStatusOnTransfer?: TurmaStatus;
}

export interface StudentSummary {
  id: string;
  fullName: string | null;
  email: string;
}

export interface TurmaSummary {
  id: string;
  nome: string;
  cursoId: string;
  cursoNome?: string;
  ativo: boolean;
}

export interface CourseSummary {
  id: string;
  nome: string;
  hasTurmas: boolean;
}
