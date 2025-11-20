import {
  Discipline,
  CreateDisciplineInput,
  UpdateDisciplineInput,
} from './discipline.types';
import {
  DisciplineRepository,
} from './discipline.repository';
import {
  DisciplineConflictError,
  DisciplineNotFoundError,
  DisciplineValidationError,
} from './errors';

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 120;

export class DisciplineService {
  constructor(private readonly repository: DisciplineRepository) {}

  async list(): Promise<Discipline[]> {
    return this.repository.list();
  }

  async create(payload: CreateDisciplineInput): Promise<Discipline> {
    const name = this.validateName(payload.name);

    const existing = await this.repository.findByName(name);
    if (existing) {
      throw new DisciplineConflictError(`Discipline "${name}" already exists`);
    }

    return this.repository.create({ name });
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

    return this.repository.update(id, { name });
  }

  async delete(id: string): Promise<void> {
    const discipline = await this.repository.findById(id);
    if (!discipline) {
      throw new DisciplineNotFoundError(`Discipline with id "${id}" was not found`);
    }

    await this.repository.delete(id);
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


