/**
 * @deprecated Use types from '@/app/shared/types' instead
 * This file re-exports for backward compatibility
 */
export type { Modality, CourseType } from "@/app/shared/types";

// Re-export Course types with Portuguese aliases for backward compatibility
export type {
  Course as Curso,
  CreateCourseInput as CreateCursoInput,
  UpdateCourseInput as UpdateCursoInput,
} from "@/app/shared/types/entities/course";
