export type MaterialType = 'Apostila' | 'Lista de Exercícios' | 'Planejamento' | 'Resumo' | 'Gabarito' | 'Outros';

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

