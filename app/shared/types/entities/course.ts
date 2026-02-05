/**
 * Tipos de entidades de curso compartilhados
 */

import type { Modality, CourseType } from "../enums";
import type { ModalityEntity } from "./modality";

export interface Course {
  id: string;
  empresaId: string;
  segmentId: string | null;
  disciplineId: string | null; // Mantido para compatibilidade, mas deprecated
  disciplineIds: string[]; // Nova propriedade para múltiplas disciplinas
  name: string;
  /** @deprecated Use modalityId and modality relation */
  modality: Modality;
  modalityId?: string; // Relation FK
  modalityData?: ModalityEntity; // Relation Data
  type: CourseType;
  description: string | null;
  year: number;
  startDate: Date | null;
  endDate: Date | null;
  accessMonths: number | null;
  planningUrl: string | null;
  coverImageUrl: string | null;
  usaTurmas: boolean;
  hotmartProductId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseInput {
  empresaId: string;
  segmentId?: string;
  disciplineId?: string; // Mantido para compatibilidade
  disciplineIds?: string[]; // Nova propriedade para múltiplas disciplinas
  name: string;
  /** @deprecated Use modalityId */
  modality?: Modality;
  modalityId?: string;
  type: CourseType;
  description?: string;
  year: number;
  startDate?: string;
  endDate?: string;
  accessMonths?: number;
  planningUrl?: string;
  coverImageUrl?: string;
  usaTurmas?: boolean;
  hotmartProductId?: string;
}

export interface UpdateCourseInput {
  segmentId?: string | null;
  disciplineId?: string | null; // Mantido para compatibilidade
  disciplineIds?: string[]; // Nova propriedade para múltiplas disciplinas
  name?: string;
  /** @deprecated Use modalityId */
  modality?: Modality;
  modalityId?: string;
  type?: CourseType;
  description?: string | null;
  year?: number;
  startDate?: string | null;
  endDate?: string | null;
  accessMonths?: number | null;
  planningUrl?: string | null;
  coverImageUrl?: string | null;
  usaTurmas?: boolean;
  hotmartProductId?: string | null;
}
