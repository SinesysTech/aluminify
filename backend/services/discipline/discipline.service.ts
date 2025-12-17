import {
  Discipline,
  CreateDisciplineInput,
  UpdateDisciplineInput,
} from './discipline.types';
import {
  DisciplineRepository,
  PaginatedResult,
} from './discipline.repository';
import {
  DisciplineConflictError,
  DisciplineNotFoundError,
  DisciplineValidationError,
} from './errors';
import type { PaginationParams } from '@/types/shared/dtos/api-responses';

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 120;

export class DisciplineService {
  constructor(private readonly repository: DisciplineRepository) {}

  async list(params?: PaginationParams): Promise<PaginatedResult<Discipline>> {
    // Cache apenas para listagem completa sem paginação ou primeira página
    if (!params || (params.page === 1 && !params.sortBy)) {
      const { cacheService } = await import('@/backend/services/cache');
      const cacheKey = 'disciplines:list:all';
      const cached = await cacheService.get<PaginatedResult<Discipline>>(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      const result = await this.repository.list(params);
      
      // Cache por 1 hora (disciplinas raramente mudam)
      await cacheService.set(cacheKey, result, 3600);
      
      return result;
    }
    
    return this.repository.list(params);
  }

  async create(payload: CreateDisciplineInput): Promise<Discipline> {
    const name = this.validateName(payload.name);

    const existing = await this.repository.findByName(name);
    if (existing) {
      throw new DisciplineConflictError(`Discipline "${name}" already exists`);
    }

    const discipline = await this.repository.create({ name });

    // Invalidar cache de estrutura hierárquica e listagem
    const { courseStructureCacheService, cacheService } = await import('@/backend/services/cache');
    await courseStructureCacheService.invalidateDisciplines([discipline.id]);
    await cacheService.del('disciplines:list:all');

    return discipline;
  }

  async update(id: string, payload: UpdateDisciplineInput): Promise<Discipline> {
    if (!payload.name) {
      return this.ensureExists(id);
    }

    const name = this.validateName(payload.name);
    const existing = await this.repository.findByName(name);
    if (existing && existing.id !== id) {
      throw new DisciplineConflictError(`Discipline "${name}" already exists`);
    }

    const discipline = await this.repository.update(id, { name });

    // Invalidar cache de estrutura hierárquica e listagem
    const { courseStructureCacheService, cacheService } = await import('@/backend/services/cache');
    await courseStructureCacheService.invalidateDisciplines([id]);
    await cacheService.del('disciplines:list:all');

    return discipline;
  }

  async delete(id: string): Promise<void> {
    const discipline = await this.repository.findById(id);
    if (!discipline) {
      throw new DisciplineNotFoundError(`Discipline with id "${id}" was not found`);
    }

    await this.repository.delete(id);

    // Invalidar cache de estrutura hierárquica e listagem
    const { courseStructureCacheService, cacheService } = await import('@/backend/services/cache');
    await courseStructureCacheService.invalidateDisciplines([id]);
    await cacheService.del('disciplines:list:all');
  }

  async getById(id: string): Promise<Discipline> {
    return this.ensureExists(id);
  }

  private validateName(name?: string): string {
    const trimmed = name?.trim();
    if (!trimmed) {
      throw new DisciplineValidationError('Name is required');
    }

    if (trimmed.length < NAME_MIN_LENGTH) {
      throw new DisciplineValidationError(
        `Name must have at least ${NAME_MIN_LENGTH} characters`,
      );
    }

    if (trimmed.length > NAME_MAX_LENGTH) {
      throw new DisciplineValidationError(
        `Name must have at most ${NAME_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private async ensureExists(id: string): Promise<Discipline> {
    const discipline = await this.repository.findById(id);
    if (!discipline) {
      throw new DisciplineNotFoundError(`Discipline with id "${id}" was not found`);
    }

    return discipline;
  }
}


