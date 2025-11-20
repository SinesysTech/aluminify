import {
  Segment,
  CreateSegmentInput,
  UpdateSegmentInput,
} from './segment.types';
import {
  SegmentRepository,
} from './segment.repository';
import {
  SegmentConflictError,
  SegmentNotFoundError,
  SegmentValidationError,
} from './errors';

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 120;
const SLUG_MIN_LENGTH = 2;
const SLUG_MAX_LENGTH = 100;

export class SegmentService {
  constructor(private readonly repository: SegmentRepository) {}

  async list(): Promise<Segment[]> {
    return this.repository.list();
  }

  async create(payload: CreateSegmentInput): Promise<Segment> {
    const name = this.validateName(payload.name);
    const slug = payload.slug ? this.validateSlug(payload.slug) : null;

    const existingByName = await this.repository.findByName(name);
    if (existingByName) {
      throw new SegmentConflictError(`Segment with name "${name}" already exists`);
    }

    if (slug) {
      const existingBySlug = await this.repository.findBySlug(slug);
      if (existingBySlug) {
        throw new SegmentConflictError(`Segment with slug "${slug}" already exists`);
      }
    }

    return this.repository.create({ name, slug });
  }

  async update(id: string, payload: UpdateSegmentInput): Promise<Segment> {
    if (!payload.name && !payload.slug) {
      return this.ensureExists(id);
    }

    const name = payload.name ? this.validateName(payload.name) : undefined;
    const slug = payload.slug !== undefined ? (payload.slug ? this.validateSlug(payload.slug) : null) : undefined;

    if (name) {
      const existingByName = await this.repository.findByName(name);
      if (existingByName && existingByName.id !== id) {
        throw new SegmentConflictError(`Segment with name "${name}" already exists`);
      }
    }

    if (slug !== undefined) {
      const existingBySlug = await this.repository.findBySlug(slug);
      if (existingBySlug && existingBySlug.id !== id) {
        throw new SegmentConflictError(`Segment with slug "${slug}" already exists`);
      }
    }

    return this.repository.update(id, { name, slug });
  }

  async delete(id: string): Promise<void> {
    const segment = await this.repository.findById(id);
    if (!segment) {
      throw new SegmentNotFoundError(`Segment with id "${id}" was not found`);
    }

    await this.repository.delete(id);
  }

  async getById(id: string): Promise<Segment> {
    return this.ensureExists(id);
  }

  private validateName(name?: string): string {
    const trimmed = name?.trim();
    if (!trimmed) {
      throw new SegmentValidationError('Name is required');
    }

    if (trimmed.length < NAME_MIN_LENGTH) {
      throw new SegmentValidationError(
        `Name must have at least ${NAME_MIN_LENGTH} characters`,
      );
    }

    if (trimmed.length > NAME_MAX_LENGTH) {
      throw new SegmentValidationError(
        `Name must have at most ${NAME_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private validateSlug(slug: string): string {
    const trimmed = slug.trim().toLowerCase();
    
    if (!trimmed) {
      throw new SegmentValidationError('Slug cannot be empty');
    }

    if (trimmed.length < SLUG_MIN_LENGTH) {
      throw new SegmentValidationError(
        `Slug must have at least ${SLUG_MIN_LENGTH} characters`,
      );
    }

    if (trimmed.length > SLUG_MAX_LENGTH) {
      throw new SegmentValidationError(
        `Slug must have at most ${SLUG_MAX_LENGTH} characters`,
      );
    }

    // Slug deve conter apenas letras minúsculas, números, hífens e underscores
    if (!/^[a-z0-9_-]+$/.test(trimmed)) {
      throw new SegmentValidationError(
        'Slug can only contain lowercase letters, numbers, hyphens and underscores',
      );
    }

    return trimmed;
  }

  private async ensureExists(id: string): Promise<Segment> {
    const segment = await this.repository.findById(id);
    if (!segment) {
      throw new SegmentNotFoundError(`Segment with id "${id}" was not found`);
    }

    return segment;
  }
}

