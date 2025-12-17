/**
 * @deprecated Use types from '@/types/shared/enums' instead
 * This file re-exports for backward compatibility
 */
export type { MaterialType } from '@/types/shared/enums';

export interface CourseMaterial {
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

export interface CreateCourseMaterialInput {
  courseId: string;
  title: string;
  description?: string;
  type?: MaterialType;
  fileUrl: string;
  order?: number;
}

export interface UpdateCourseMaterialInput {
  title?: string;
  description?: string | null;
  type?: MaterialType;
  fileUrl?: string;
  order?: number;
}

