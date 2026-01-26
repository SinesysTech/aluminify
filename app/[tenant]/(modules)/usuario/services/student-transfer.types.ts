export interface BulkTransferCourseRequest {
  studentIds: string[];
  sourceCourseId: string;
  targetCourseId: string;
  options?: {
    keepOriginalEnrollment?: boolean;
    copyGrades?: boolean;
  };
}

export interface BulkTransferTurmaRequest {
  studentIds: string[];
  sourceTurmaId: string;
  targetTurmaId: string;
  sourceStatusOnTransfer?: "concluido" | "cancelado" | "trancado";
}

export interface BulkTransferResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    studentId: string;
    error: string;
  }>;
}
