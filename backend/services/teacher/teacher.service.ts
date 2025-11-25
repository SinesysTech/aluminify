import {
  Teacher,
  CreateTeacherInput,
  UpdateTeacherInput,
} from './teacher.types';
import {
  TeacherRepository,
} from './teacher.repository';
import {
  TeacherConflictError,
  TeacherNotFoundError,
  TeacherValidationError,
} from './errors';
import { getDatabaseClient } from '@/backend/clients/database';
import { randomBytes } from 'crypto';

const FULL_NAME_MIN_LENGTH = 3;
const FULL_NAME_MAX_LENGTH = 200;
const EMAIL_MAX_LENGTH = 255;
const CPF_LENGTH = 11;
const PHONE_MIN_LENGTH = 10;
const PHONE_MAX_LENGTH = 15;
const BIOGRAPHY_MAX_LENGTH = 2000;
const SPECIALTY_MAX_LENGTH = 200;

export class TeacherService {
  constructor(private readonly repository: TeacherRepository) {}

  async list(): Promise<Teacher[]> {
    return this.repository.list();
  }

  async create(payload: CreateTeacherInput): Promise<Teacher> {
    const fullName = this.validateFullName(payload.fullName);
    const email = this.validateEmail(payload.email);
    
    const existingByEmail = await this.repository.findByEmail(email);
    if (existingByEmail) {
      throw new TeacherConflictError(`Teacher with email "${email}" already exists`);
    }

    if (payload.cpf) {
      const cpf = this.validateCpf(payload.cpf);
      const existingByCpf = await this.repository.findByCpf(cpf);
      if (existingByCpf) {
        throw new TeacherConflictError(`Teacher with CPF "${cpf}" already exists`);
      }
    }

    const phone = payload.phone ? this.validatePhone(payload.phone) : undefined;
    const biography = payload.biography ? this.validateBiography(payload.biography) : undefined;
    const specialty = payload.specialty ? this.validateSpecialty(payload.specialty) : undefined;

    // Se o ID não foi fornecido, precisamos criar o usuário no auth.users primeiro
    // usando o Admin API do Supabase
    let teacherId = payload.id;
    if (!teacherId) {
      const adminClient = getDatabaseClient();
      
      // Gerar uma senha temporária aleatória
      const tempPassword = randomBytes(16).toString('hex');
      
      // Criar o usuário no auth.users usando Admin API
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          role: 'professor',
          full_name: fullName,
        },
      });

      if (authError || !authUser?.user) {
        throw new Error(`Failed to create auth user: ${authError?.message || 'Unknown error'}`);
      }

      teacherId = authUser.user.id;
    }

    return this.repository.create({
      id: teacherId,
      fullName,
      email,
      cpf: payload.cpf ? this.validateCpf(payload.cpf) : undefined,
      phone,
      biography,
      photoUrl: payload.photoUrl?.trim() || undefined,
      specialty,
    });
  }

  async update(id: string, payload: UpdateTeacherInput): Promise<Teacher> {
    await this.ensureExists(id);

    const updateData: UpdateTeacherInput = {};

    if (payload.fullName !== undefined) {
      updateData.fullName = this.validateFullName(payload.fullName);
    }

    if (payload.email !== undefined) {
      const email = this.validateEmail(payload.email);
      const existingByEmail = await this.repository.findByEmail(email);
      if (existingByEmail && existingByEmail.id !== id) {
        throw new TeacherConflictError(`Teacher with email "${email}" already exists`);
      }
      updateData.email = email;
    }

    if (payload.cpf !== undefined) {
      if (payload.cpf) {
        const cpf = this.validateCpf(payload.cpf);
        const existingByCpf = await this.repository.findByCpf(cpf);
        if (existingByCpf && existingByCpf.id !== id) {
          throw new TeacherConflictError(`Teacher with CPF "${cpf}" already exists`);
        }
        updateData.cpf = cpf;
      } else {
        updateData.cpf = null;
      }
    }

    if (payload.phone !== undefined) {
      updateData.phone = payload.phone ? this.validatePhone(payload.phone) : null;
    }

    if (payload.biography !== undefined) {
      updateData.biography = payload.biography ? this.validateBiography(payload.biography) : null;
    }

    if (payload.photoUrl !== undefined) {
      updateData.photoUrl = payload.photoUrl?.trim() || null;
    }

    if (payload.specialty !== undefined) {
      updateData.specialty = payload.specialty ? this.validateSpecialty(payload.specialty) : null;
    }

    return this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.repository.delete(id);
  }

  async getById(id: string): Promise<Teacher> {
    return this.ensureExists(id);
  }

  private validateFullName(fullName?: string): string {
    const trimmed = fullName?.trim();
    if (!trimmed) {
      throw new TeacherValidationError('Full name is required');
    }

    if (trimmed.length < FULL_NAME_MIN_LENGTH) {
      throw new TeacherValidationError(
        `Full name must have at least ${FULL_NAME_MIN_LENGTH} characters`,
      );
    }

    if (trimmed.length > FULL_NAME_MAX_LENGTH) {
      throw new TeacherValidationError(
        `Full name must have at most ${FULL_NAME_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private validateEmail(email?: string): string {
    const trimmed = email?.trim().toLowerCase();
    if (!trimmed) {
      throw new TeacherValidationError('Email is required');
    }

    if (trimmed.length > EMAIL_MAX_LENGTH) {
      throw new TeacherValidationError(`Email must have at most ${EMAIL_MAX_LENGTH} characters`);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new TeacherValidationError('Invalid email format');
    }

    return trimmed;
  }

  private validateCpf(cpf?: string): string {
    const cleaned = cpf?.replace(/\D/g, '');
    if (!cleaned || cleaned.length !== CPF_LENGTH) {
      throw new TeacherValidationError(`CPF must have exactly ${CPF_LENGTH} digits`);
    }

    return cleaned;
  }

  private validatePhone(phone?: string): string {
    const cleaned = phone?.replace(/\D/g, '');
    if (!cleaned) {
      throw new TeacherValidationError('Phone cannot be empty');
    }

    if (cleaned.length < PHONE_MIN_LENGTH || cleaned.length > PHONE_MAX_LENGTH) {
      throw new TeacherValidationError(
        `Phone must have between ${PHONE_MIN_LENGTH} and ${PHONE_MAX_LENGTH} digits`,
      );
    }

    return cleaned;
  }

  private validateBiography(biography?: string): string {
    const trimmed = biography?.trim();
    if (!trimmed) {
      return '';
    }

    if (trimmed.length > BIOGRAPHY_MAX_LENGTH) {
      throw new TeacherValidationError(
        `Biography must have at most ${BIOGRAPHY_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private validateSpecialty(specialty?: string): string {
    const trimmed = specialty?.trim();
    if (!trimmed) {
      throw new TeacherValidationError('Specialty cannot be empty');
    }

    if (trimmed.length > SPECIALTY_MAX_LENGTH) {
      throw new TeacherValidationError(
        `Specialty must have at most ${SPECIALTY_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private async ensureExists(id: string): Promise<Teacher> {
    const teacher = await this.repository.findById(id);
    if (!teacher) {
      throw new TeacherNotFoundError(`Teacher with id "${id}" was not found`);
    }

    return teacher;
  }
}

