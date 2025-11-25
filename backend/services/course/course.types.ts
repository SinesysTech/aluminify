export type Modality = 'EAD' | 'LIVE';
export type CourseType = 'Superextensivo' | 'Extensivo' | 'Intensivo' | 'Superintensivo' | 'Revisão';

export interface Course {
  id: string;
  segmentId: string | null;
  disciplineId: string | null; // Mantido para compatibilidade, mas deprecated
  disciplineIds: string[]; // Nova propriedade para múltiplas disciplinas
  name: string;
  modality: Modality;
  type: CourseType;
  description: string | null;
  year: number;
  startDate: Date | null;
  endDate: Date | null;
  accessMonths: number | null;
  planningUrl: string | null;
  coverImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseInput {
  segmentId?: string;
  disciplineId?: string; // Mantido para compatibilidade
  disciplineIds?: string[]; // Nova propriedade para múltiplas disciplinas
  name: string;
  modality: Modality;
  type: CourseType;
  description?: string;
  year: number;
  startDate?: string;
  endDate?: string;
  accessMonths?: number;
  planningUrl?: string;
  coverImageUrl?: string;
}

export interface UpdateCourseInput {
  segmentId?: string | null;
  disciplineId?: string | null; // Mantido para compatibilidade
  disciplineIds?: string[]; // Nova propriedade para múltiplas disciplinas
  name?: string;
  modality?: Modality;
  type?: CourseType;
  description?: string | null;
  year?: number;
  startDate?: string | null;
  endDate?: string | null;
  accessMonths?: number | null;
  planningUrl?: string | null;
  coverImageUrl?: string | null;
}

