import {
  Curso,
  CreateCursoInput,
  UpdateCursoInput,
  Modality,
  CourseType,
} from "./curso.types";
import { CursoRepository, PaginatedResult } from "./curso.repository";
import {
  CourseValidationError,
  CourseNotFoundError,
} from "./errors";
import { PaginationParams } from "@/app/shared/types/dtos/api-responses";

const VALID_MODALITIES: Modality[] = ["EAD", "LIVE"];
const VALID_COURSE_TYPES: CourseType[] = [
  "Superextensivo",
  "Extensivo",
  "Intensivo",
  "Superintensivo",
  "Revisão",
];

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 255;
const DESCRIPTION_MAX_LENGTH = 1000;
const YEAR_MIN = 2000;
const YEAR_MAX = 2100;
const ACCESS_MONTHS_MIN = 1;
const ACCESS_MONTHS_MAX = 36;

export class CursoService {
  constructor(private readonly repository: CursoRepository) {}

  async list(
    params?: PaginationParams,
    empresaId?: string,
  ): Promise<PaginatedResult<Curso>> {
    const result = await this.repository.list(params, empresaId);

    // Invalidar cache de estrutura se necessário (embora listagem geralmente use cache próprio)
    // Aqui não invalidamos, apenas retornamos
    // O cache é gerenciado nos métodos de mutação (create, update, delete)

    return result;
  }

  async create(payload: CreateCursoInput): Promise<Curso> {
    // Validar empresaId é obrigatório
    if (!payload.empresaId) {
      throw new CourseValidationError("empresaId is required");
    }

    const name = this.validateName(payload.name);
    const modality = this.validateModality(payload.modality);
    const type = this.validateCourseType(payload.type);
    const year = this.validateYear(payload.year);
    const description = payload.description
      ? this.validateDescription(payload.description)
      : undefined;
    const accessMonths = payload.accessMonths
      ? this.validateAccessMonths(payload.accessMonths)
      : undefined;
    const startDate = payload.startDate
      ? this.validateDate(payload.startDate)
      : undefined;
    const endDate = payload.endDate
      ? this.validateDate(payload.endDate)
      : undefined;

    if (startDate && endDate && startDate > endDate) {
      throw new CourseValidationError(
        "Start date must be before or equal to end date",
      );
    }

    if (payload.segmentId) {
      await this.ensureSegmentExists(payload.segmentId);
    }

    // Validar disciplinas: usar disciplineIds se fornecido, senão usar disciplineId (compatibilidade)
    const disciplineIds =
      payload.disciplineIds ??
      (payload.disciplineId ? [payload.disciplineId] : []);

    if (disciplineIds.length > 0) {
      const uniqueIds = Array.from(new Set(disciplineIds));
      const existingIds = await this.repository.getExistingDisciplineIds(uniqueIds);

      if (existingIds.length !== uniqueIds.length) {
        const existingSet = new Set(existingIds);
        for (const id of uniqueIds) {
           if (!existingSet.has(id)) {
             throw new CourseValidationError(
               `Discipline with id "${id}" does not exist`,
             );
           }
        }
      }
    }

    const course = await this.repository.create({
      empresaId: payload.empresaId,
      segmentId: payload.segmentId ?? undefined,
      disciplineId: payload.disciplineId ?? undefined, // Mantido para compatibilidade
      disciplineIds: disciplineIds, // Nova propriedade
      name,
      modality,
      type,
      description,
      year,
      startDate: startDate?.toISOString().split("T")[0],
      endDate: endDate?.toISOString().split("T")[0],
      accessMonths,
      planningUrl: payload.planningUrl ?? undefined,
      coverImageUrl: payload.coverImageUrl ?? undefined,
      hotmartProductId: payload.hotmartProductId ?? undefined,
    });

    // Invalidar cache de estrutura hierárquica e listagem (por empresa)
    const { courseStructureCacheService, cacheService } =
      await import("@/app/shared/core/services/cache");
    await courseStructureCacheService.invalidateCourse(course.id);
    await cacheService.del(`courses:list:empresa:${payload.empresaId}:all`);
    // Também limpar cache legado (sem empresa) para segurança
    await cacheService.del("courses:list:all");

    return course;
  }

  async update(id: string, payload: UpdateCursoInput): Promise<Curso> {
    await this.ensureExists(id);

    const updateData: UpdateCursoInput = {};

    if (payload.name !== undefined) {
      updateData.name = this.validateName(payload.name);
    }

    if (payload.modality !== undefined) {
      updateData.modality = this.validateModality(payload.modality);
    }

    if (payload.type !== undefined) {
      updateData.type = this.validateCourseType(payload.type);
    }

    if (payload.year !== undefined) {
      updateData.year = this.validateYear(payload.year);
    }

    if (payload.description !== undefined) {
      updateData.description = payload.description
        ? this.validateDescription(payload.description)
        : null;
    }

    if (payload.accessMonths !== undefined) {
      updateData.accessMonths = payload.accessMonths
        ? this.validateAccessMonths(payload.accessMonths)
        : null;
    }

    if (payload.startDate !== undefined) {
      updateData.startDate = payload.startDate
        ? this.validateDate(payload.startDate).toISOString().split("T")[0]
        : null;
    }

    if (payload.endDate !== undefined) {
      updateData.endDate = payload.endDate
        ? this.validateDate(payload.endDate).toISOString().split("T")[0]
        : null;
    }

    if (
      updateData.startDate &&
      updateData.endDate &&
      updateData.startDate > updateData.endDate
    ) {
      throw new CourseValidationError(
        "Start date must be before or equal to end date",
      );
    }

    if (payload.segmentId !== undefined) {
      if (payload.segmentId) {
        await this.ensureSegmentExists(payload.segmentId);
      }
      updateData.segmentId = payload.segmentId;
    }

    // Validar disciplinas se fornecidas
    if (payload.disciplineIds !== undefined) {
      if (payload.disciplineIds.length > 0) {
        const uniqueIds = Array.from(new Set(payload.disciplineIds));
        const existingIds = await this.repository.getExistingDisciplineIds(uniqueIds);

        if (existingIds.length !== uniqueIds.length) {
          const existingSet = new Set(existingIds);
          for (const id of uniqueIds) {
             if (!existingSet.has(id)) {
               throw new CourseValidationError(
                 `Discipline with id "${id}" does not exist`,
               );
             }
          }
        }
      }
      updateData.disciplineIds = payload.disciplineIds;
    } else if (payload.disciplineId !== undefined) {
      // Compatibilidade: se disciplineId foi fornecido, validar e converter para array
      if (payload.disciplineId) {
        await this.ensureDisciplineExists(payload.disciplineId);
        updateData.disciplineIds = [payload.disciplineId];
      } else {
        updateData.disciplineIds = [];
      }
      updateData.disciplineId = payload.disciplineId; // Mantido para compatibilidade
    }

    if (payload.planningUrl !== undefined) {
      updateData.planningUrl = payload.planningUrl;
    }

    if (payload.coverImageUrl !== undefined) {
      updateData.coverImageUrl = payload.coverImageUrl;
    }

    if (payload.usaTurmas !== undefined) {
      updateData.usaTurmas = payload.usaTurmas;
    }

    if (payload.hotmartProductId !== undefined) {
      updateData.hotmartProductId = payload.hotmartProductId;
    }

    const course = await this.repository.update(id, updateData);

    // Invalidar cache de estrutura hierárquica e listagem (por empresa)
    const { courseStructureCacheService, cacheService } =
      await import("@/app/shared/core/services/cache");
    await courseStructureCacheService.invalidateCourse(id);
    if (course.empresaId) {
      await cacheService.del(`courses:list:empresa:${course.empresaId}:all`);
    }
    await cacheService.del("courses:list:all");

    return course;
  }

  async delete(id: string): Promise<void> {
    const course = await this.ensureExists(id);
    await this.repository.delete(id);

    // Invalidar cache de estrutura hierárquica e listagem (por empresa)
    const { courseStructureCacheService, cacheService } =
      await import("@/app/shared/core/services/cache");
    await courseStructureCacheService.invalidateCourse(id);
    if (course.empresaId) {
      await cacheService.del(`courses:list:empresa:${course.empresaId}:all`);
    }
    await cacheService.del("courses:list:all");
  }

  async getById(id: string): Promise<Curso> {
    return this.ensureExists(id);
  }

  private validateName(name?: string): string {
    const trimmed = name?.trim();
    if (!trimmed) {
      throw new CourseValidationError("Name is required");
    }

    if (trimmed.length < NAME_MIN_LENGTH) {
      throw new CourseValidationError(
        `Name must have at least ${NAME_MIN_LENGTH} characters`,
      );
    }

    if (trimmed.length > NAME_MAX_LENGTH) {
      throw new CourseValidationError(
        `Name must have at most ${NAME_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private validateModality(modality?: Modality): Modality {
    if (!modality) {
      throw new CourseValidationError("Modality is required");
    }

    if (!VALID_MODALITIES.includes(modality)) {
      throw new CourseValidationError(
        `Modality must be one of: ${VALID_MODALITIES.join(", ")}`,
      );
    }

    return modality;
  }

  private validateCourseType(type?: CourseType): CourseType {
    if (!type) {
      throw new CourseValidationError("Type is required");
    }

    if (!VALID_COURSE_TYPES.includes(type)) {
      throw new CourseValidationError(
        `Type must be one of: ${VALID_COURSE_TYPES.join(", ")}`,
      );
    }

    return type;
  }

  private validateDescription(description?: string): string {
    const trimmed = description?.trim();
    if (!trimmed) {
      return "";
    }

    if (trimmed.length > DESCRIPTION_MAX_LENGTH) {
      throw new CourseValidationError(
        `Description must have at most ${DESCRIPTION_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private validateYear(year?: number): number {
    if (year === undefined || year === null) {
      throw new CourseValidationError("Year is required");
    }

    if (!Number.isInteger(year) || year < YEAR_MIN || year > YEAR_MAX) {
      throw new CourseValidationError(
        `Year must be an integer between ${YEAR_MIN} and ${YEAR_MAX}`,
      );
    }

    return year;
  }

  private validateAccessMonths(months?: number): number {
    if (months === undefined || months === null) {
      throw new CourseValidationError("Access months is required");
    }

    if (
      !Number.isInteger(months) ||
      months < ACCESS_MONTHS_MIN ||
      months > ACCESS_MONTHS_MAX
    ) {
      throw new CourseValidationError(
        `Access months must be an integer between ${ACCESS_MONTHS_MIN} and ${ACCESS_MONTHS_MAX}`,
      );
    }

    return months;
  }

  private validateDate(dateString?: string): Date {
    if (!dateString) {
      throw new CourseValidationError("Date is required");
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new CourseValidationError("Invalid date format");
    }

    return date;
  }

  private async ensureExists(id: string): Promise<Curso> {
    const course = await this.repository.findById(id);
    if (!course) {
      throw new CourseNotFoundError(`Course with id "${id}" was not found`);
    }

    return course;
  }

  private async ensureSegmentExists(segmentId: string): Promise<void> {
    const exists = await this.repository.segmentExists(segmentId);
    if (!exists) {
      throw new CourseValidationError(
        `Segment with id "${segmentId}" does not exist`,
      );
    }
  }

  private async ensureDisciplineExists(disciplineId: string): Promise<void> {
    const exists = await this.repository.disciplineExists(disciplineId);
    if (!exists) {
      throw new CourseValidationError(
        `Discipline with id "${disciplineId}" does not exist`,
      );
    }
  }
}
