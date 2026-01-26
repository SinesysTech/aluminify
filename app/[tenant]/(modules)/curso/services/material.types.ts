/**
 * @deprecated Use types from '@/app/shared/types/enums' instead
 * This file re-exports for backward compatibility
 */
import type { MaterialType } from "@/app/shared/types/enums";

export type { MaterialType };

export interface MaterialCurso {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  type: MaterialType;
  fileUrl: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaterialCursoInput {
  courseId: string;
  title: string;
  description?: string;
  type?: MaterialType;
  fileUrl: string;
  order?: number;
}

export interface UpdateMaterialCursoInput {
  title?: string;
  description?: string | null;
  type?: MaterialType;
  fileUrl?: string;
  order?: number;
}
