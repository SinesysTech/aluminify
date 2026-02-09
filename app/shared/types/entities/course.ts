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
  /**
   * IDs de produtos da Hotmart associados ao curso.
   * Um curso pode ter vários IDs (ex.: produto avulso + assinatura).
   */
  hotmartProductIds: string[];
  /**
   * @deprecated Use `hotmartProductIds`.
   * Mantido por compatibilidade: representa o primeiro item de `hotmartProductIds` (ou null).
   */
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
  /**
   * @deprecated Use `hotmartProductIds`.
   */
  hotmartProductId?: string;
  hotmartProductIds?: string[];
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
  /**
   * @deprecated Use `hotmartProductIds`.
   */
  hotmartProductId?: string | null;
  /**
   * Lista completa de IDs Hotmart (substitui o mapeamento anterior).
   * - `[]` limpa os IDs
   * - `undefined` não altera
   */
  hotmartProductIds?: string[];
}
