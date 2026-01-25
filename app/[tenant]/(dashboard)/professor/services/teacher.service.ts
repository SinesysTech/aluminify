import {
  Teacher,
  CreateTeacherInput,
  UpdateTeacherInput,
} from './teacher.types';
import {
  TeacherRepository,
  PaginatedResult,
} from './teacher.repository';
import {
  TeacherConflictError,
  TeacherNotFoundError,
  TeacherValidationError,
} from './errors';
import { getDatabaseClient } from '@/app/shared/core/database/database';
import { randomBytes } from 'crypto';
import type { PaginationParams } from '@/types/shared/dtos/api-responses';
import { isValidBRPhone, isValidCPF, normalizeBRPhone, normalizeCpf } from '@/app/shared/library/br';

const FULL_NAME_MIN_LENGTH = 3;
const FULL_NAME_MAX_LENGTH = 200;
const EMAIL_MAX_LENGTH = 255;
const CPF_LENGTH = 11;
const BIOGRAPHY_MAX_LENGTH = 2000;
const SPECIALTY_MAX_LENGTH = 200;

export class TeacherService {
  constructor(private readonly repository: TeacherRepository) {}

  async list(params?: PaginationParams): Promise<PaginatedResult<Teacher>> {
    return this.repository.list(params);
  }

  async create(payload: CreateTeacherInput): Promise<Teacher> {
    // Validar empresaId é obrigatório (pode ser null apenas quando criado por Super Admin via endpoint específico)
    // A validação de permissão é feita no endpoint, aqui apenas validamos se fornecido
    if (payload.empresaId === undefined) {
      throw new TeacherValidationError('empresaId is required');
    }

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

    // Se o ID não foi fornecido, precisamos verificar se o usuário já existe no auth.users
    // ou criar um novo usuário se não existir
    let teacherId = payload.id;
    if (!teacherId) {
      const adminClient = getDatabaseClient();
      
      // Tentar criar um novo usuário
      const tempPassword = randomBytes(16).toString('hex');
      
      // Construir metadata - incluir empresa_id apenas se fornecido (não null)
      const userMetadata: Record<string, unknown> = {
        role: 'professor',
        full_name: fullName,
        is_admin: payload.isAdmin ?? false,
      };
      
      if (payload.empresaId) {
        userMetadata.empresa_id = payload.empresaId;
      }
      
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: userMetadata,
      });

      if (authError) {
        // Se o erro for de email já existente, buscar o usuário existente diretamente
        if (authError.message?.includes('already registered') || 
            authError.message?.includes('already exists') ||
            authError.status === 422) {
          
          // Buscar usuário existente por email usando listUsers
          const { data: usersList, error: getUserError } = await adminClient.auth.admin.listUsers();
          
          if (getUserError) {
            throw new Error(`Failed to get existing user: ${getUserError.message || 'User not found'}`);
          }
          
          const existingUser = usersList?.users?.find(user => user.email === email);
          
          if (existingUser) {
            teacherId = existingUser.id;
            
            // Atualizar metadata para garantir que o role está correto
            const updateMetadata: Record<string, unknown> = {
              ...existingUser.user_metadata,
              role: 'professor',
              full_name: fullName,
              is_admin: payload.isAdmin ?? false,
            };
            
            if (payload.empresaId) {
              updateMetadata.empresa_id = payload.empresaId;
            }
            
            await adminClient.auth.admin.updateUserById(existingUser.id, {
              user_metadata: updateMetadata,
            });
          } else {
            throw new Error(`User with email "${email}" exists but could not be found`);
          }
        } else {
          throw new Error(`Failed to create auth user: ${authError.message || 'Unknown error'}`);
        }
      } else if (authUser?.user) {
        teacherId = authUser.user.id;
      } else {
        throw new Error('Failed to create auth user: No user returned');
      }
    }

    // Criar registro - o repositório deve aceitar empresaId null
    return await this.repository.create({
      id: teacherId,
      empresaId: payload.empresaId,
      isAdmin: payload.isAdmin ?? false,
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
    const cleaned = normalizeCpf(cpf || '');
    if (!cleaned || cleaned.length !== CPF_LENGTH) {
      throw new TeacherValidationError(`CPF must have exactly ${CPF_LENGTH} digits`);
    }
    if (!isValidCPF(cleaned)) {
      throw new TeacherValidationError('Invalid CPF');
    }
    return cleaned;
  }

  private validatePhone(phone?: string): string {
    const cleaned = normalizeBRPhone(phone || '');
    if (!cleaned) {
      throw new TeacherValidationError('Phone cannot be empty');
    }

    // padrão BR: 10 ou 11 dígitos (DDD + número)
    if (!isValidBRPhone(cleaned)) {
      throw new TeacherValidationError('Invalid phone number');
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

