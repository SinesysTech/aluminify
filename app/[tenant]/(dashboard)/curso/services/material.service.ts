import {
  MaterialCurso,
  CreateMaterialCursoInput,
  UpdateMaterialCursoInput,
  MaterialType,
} from "./material.types";
import { MaterialCursoRepository } from "./material.repository";
import {
  CourseMaterialNotFoundError,
  CourseMaterialValidationError,
} from "./errors";
import { cacheService } from "@/backend/services/cache";

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 2000;
const ORDER_MIN = 0;
const ORDER_MAX = 10000;

const VALID_MATERIAL_TYPES: MaterialType[] = [
  "Apostila",
  "Lista de Exercícios",
  "Planejamento",
  "Resumo",
  "Gabarito",
  "Outros",
];

export class MaterialCursoService {
  constructor(private readonly repository: MaterialCursoRepository) {}

  async list(): Promise<MaterialCurso[]> {
    return this.repository.list();
  }

  async listByCourse(courseId: string): Promise<MaterialCurso[]> {
    const cacheKey = `cache:curso:${courseId}:materiais`;

    return cacheService.getOrSet(
      cacheKey,
      () => this.repository.findByCourseId(courseId),
      1800, // TTL: 30 minutos
    );
  }

  async create(payload: CreateMaterialCursoInput): Promise<MaterialCurso> {
    await this.ensureCourseExists(payload.courseId);

    const title = this.validateTitle(payload.title);
    const type = this.validateMaterialType(payload.type);
    const fileUrl = this.validateFileUrl(payload.fileUrl);
    const description = payload.description
      ? this.validateDescription(payload.description)
      : undefined;
    const order =
      payload.order !== undefined ? this.validateOrder(payload.order) : 0;

    const material = await this.repository.create({
      courseId: payload.courseId,
      title,
      description,
      type,
      fileUrl,
      order,
    });

    // Invalidar cache do curso
    await cacheService.del(`cache:curso:${payload.courseId}:materiais`);

    return material;
  }

  async update(
    id: string,
    payload: UpdateMaterialCursoInput,
  ): Promise<MaterialCurso> {
    await this.ensureExists(id);

    const updateData: UpdateCourseMaterialInput = {};

    if (payload.title !== undefined) {
      updateData.title = this.validateTitle(payload.title);
    }

    if (payload.description !== undefined) {
      updateData.description = payload.description
        ? this.validateDescription(payload.description)
        : null;
    }

    if (payload.type !== undefined) {
      updateData.type = this.validateMaterialType(payload.type);
    }

    if (payload.fileUrl !== undefined) {
      updateData.fileUrl = this.validateFileUrl(payload.fileUrl);
    }

    if (payload.order !== undefined) {
      updateData.order = this.validateOrder(payload.order);
    }

    const material = await this.repository.update(id, updateData);

    // Invalidar cache do curso
    await cacheService.del(`cache:curso:${material.courseId}:materiais`);

    return material;
  }

  async delete(id: string): Promise<void> {
    const material = await this.ensureExists(id);
    await this.repository.delete(id);

    // Invalidar cache do curso
    await cacheService.del(`cache:curso:${material.courseId}:materiais`);
  }

  async getById(id: string): Promise<MaterialCurso> {
    return this.ensureExists(id);
  }

  private validateTitle(title?: string): string {
    const trimmed = title?.trim();
    if (!trimmed) {
      throw new CourseMaterialValidationError("Title is required");
    }

    if (trimmed.length < TITLE_MIN_LENGTH) {
      throw new CourseMaterialValidationError(
        `Title must have at least ${TITLE_MIN_LENGTH} characters`,
      );
    }

    if (trimmed.length > TITLE_MAX_LENGTH) {
      throw new CourseMaterialValidationError(
        `Title must have at most ${TITLE_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private validateDescription(description?: string): string {
    const trimmed = description?.trim();
    if (!trimmed) {
      return "";
    }

    if (trimmed.length > DESCRIPTION_MAX_LENGTH) {
      throw new CourseMaterialValidationError(
        `Description must have at most ${DESCRIPTION_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private validateMaterialType(type?: MaterialType): MaterialType {
    if (!type) {
      return "Apostila";
    }

    if (!VALID_MATERIAL_TYPES.includes(type)) {
      throw new CourseMaterialValidationError(
        `Type must be one of: ${VALID_MATERIAL_TYPES.join(", ")}`,
      );
    }

    return type;
  }

  private validateFileUrl(fileUrl?: string): string {
    const trimmed = fileUrl?.trim();
    if (!trimmed) {
      throw new CourseMaterialValidationError("File URL is required");
    }

    try {
      new URL(trimmed);
    } catch {
      throw new CourseMaterialValidationError("File URL must be a valid URL");
    }

    return trimmed;
  }

  private validateOrder(order?: number): number {
    if (order === undefined || order === null) {
      return 0;
    }

    if (!Number.isInteger(order) || order < ORDER_MIN || order > ORDER_MAX) {
      throw new CourseMaterialValidationError(
        `Order must be an integer between ${ORDER_MIN} and ${ORDER_MAX}`,
      );
    }

    return order;
  }

  private async ensureExists(id: string): Promise<MaterialCurso> {
    const material = await this.repository.findById(id);
    if (!material) {
      throw new CourseMaterialNotFoundError(
        `Course material with id "${id}" was not found`,
      );
    }
    return material;
  }

  private async ensureCourseExists(courseId: string): Promise<void> {
    const exists = await this.repository.courseExists(courseId);
    if (!exists) {
      throw new CourseMaterialValidationError(
        `Course with id "${courseId}" does not exist`,
      );
    }
  }
}
