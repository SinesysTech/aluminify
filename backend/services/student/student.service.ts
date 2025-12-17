import { Student, CreateStudentInput, UpdateStudentInput } from './student.types';
import { StudentRepository, PaginatedResult } from './student.repository';
import {
  StudentConflictError,
  StudentNotFoundError,
  StudentValidationError,
} from './errors';
import { getDatabaseClient } from '@/backend/clients/database';
import type { PaginationParams } from '@/types/shared/dtos/api-responses';

const FULL_NAME_MIN_LENGTH = 3;
const FULL_NAME_MAX_LENGTH = 200;
const EMAIL_MAX_LENGTH = 255;
const CPF_LENGTH = 11;
const PHONE_MIN_LENGTH = 10;
const PHONE_MAX_LENGTH = 15;
const ZIP_CODE_LENGTH = 8;
const ENROLLMENT_NUMBER_MAX_LENGTH = 50;
const SOCIAL_HANDLE_MAX_LENGTH = 100;
const COURSE_MIN_SELECTION = 1;
const COURSE_NAME_MAX_LENGTH_FOR_PASSWORD = 32;

let _adminClient: ReturnType<typeof getDatabaseClient> | null = null;

function getAdminClient() {
  if (!_adminClient) {
    _adminClient = getDatabaseClient();
  }
  return _adminClient;
}

export class StudentService {
  constructor(private readonly repository: StudentRepository) {}

  async list(params?: PaginationParams): Promise<PaginatedResult<Student>> {
    return this.repository.list(params);
  }

  async create(payload: CreateStudentInput): Promise<Student> {
    const email = this.validateEmail(payload.email);
    
    const existingByEmail = await this.repository.findByEmail(email);
    if (existingByEmail) {
      throw new StudentConflictError(`Student with email "${email}" already exists`);
    }

    const courseIds = this.validateCourseIds(payload.courseIds);
    const courses = await this.fetchCourses(courseIds);
    if (courses.length !== courseIds.length) {
      throw new StudentValidationError('Um ou mais cursos selecionados são inválidos.');
    }

    const primaryCourse = courses[0];

    if (payload.cpf) {
      const cpf = this.validateCpf(payload.cpf);
      const existingByCpf = await this.repository.findByCpf(cpf);
      if (existingByCpf) {
        throw new StudentConflictError(`Student with CPF "${cpf}" already exists`);
      }
    }

    if (payload.enrollmentNumber) {
      const enrollmentNumber = this.validateEnrollmentNumber(payload.enrollmentNumber);
      const existingByEnrollment = await this.repository.findByEnrollmentNumber(enrollmentNumber);
      if (existingByEnrollment) {
        throw new StudentConflictError(`Student with enrollment number "${enrollmentNumber}" already exists`);
      }
    }

    const fullName = payload.fullName ? this.validateFullName(payload.fullName) : undefined;
    const phone = payload.phone ? this.validatePhone(payload.phone) : undefined;
    const zipCode = payload.zipCode ? this.validateZipCode(payload.zipCode) : undefined;
    const birthDate = payload.birthDate ? this.validateDate(payload.birthDate) : undefined;
    const instagram = payload.instagram ? this.validateSocialHandle(payload.instagram) : undefined;
    const twitter = payload.twitter ? this.validateSocialHandle(payload.twitter) : undefined;

    const cpf = payload.cpf ? this.validateCpf(payload.cpf) : undefined;
    let temporaryPassword = payload.temporaryPassword?.trim();

    if (!temporaryPassword) {
      if (!cpf) {
        throw new StudentValidationError(
          'Informe o CPF ou defina manualmente a senha temporária para o aluno.',
        );
      }
      temporaryPassword = this.generateDefaultPassword(cpf, primaryCourse.name);
    }

    if (temporaryPassword.length < 8) {
      throw new StudentValidationError('A senha temporária deve ter pelo menos 8 caracteres.');
    }

    // Se o ID não foi fornecido, precisamos criar o usuário no auth.users primeiro
    // usando o Admin API do Supabase
    let studentId = payload.id;
    if (!studentId) {
      // Criar o usuário no auth.users usando Admin API
      const { data: authUser, error: authError } = await getAdminClient().auth.admin.createUser({
        email: email,
        password: temporaryPassword,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          role: 'aluno',
          full_name: fullName,
          must_change_password: true,
        },
      });

      if (authError || !authUser?.user) {
        throw new Error(`Failed to create auth user: ${authError?.message || 'Unknown error'}`);
      }

      studentId = authUser.user.id;
    }

    return this.repository.create({
      id: studentId,
      fullName,
      email,
      cpf,
      phone,
      birthDate: birthDate?.toISOString().split('T')[0],
      address: payload.address?.trim() || undefined,
      zipCode,
      enrollmentNumber: payload.enrollmentNumber ? this.validateEnrollmentNumber(payload.enrollmentNumber) : undefined,
      instagram,
      twitter,
      courseIds,
      mustChangePassword: true,
      temporaryPassword,
    });
  }

  async update(id: string, payload: UpdateStudentInput): Promise<Student> {
    await this.ensureExists(id);

    const updateData: UpdateStudentInput = {};

    if (payload.fullName !== undefined) {
      updateData.fullName = payload.fullName ? this.validateFullName(payload.fullName) : null;
    }

    if (payload.email !== undefined) {
      const email = this.validateEmail(payload.email);
      const existingByEmail = await this.repository.findByEmail(email);
      if (existingByEmail && existingByEmail.id !== id) {
        throw new StudentConflictError(`Student with email "${email}" already exists`);
      }
      updateData.email = email;
    }

    if (payload.cpf !== undefined) {
      if (payload.cpf) {
        const cpf = this.validateCpf(payload.cpf);
        const existingByCpf = await this.repository.findByCpf(cpf);
        if (existingByCpf && existingByCpf.id !== id) {
          throw new StudentConflictError(`Student with CPF "${cpf}" already exists`);
        }
        updateData.cpf = cpf;
      } else {
        updateData.cpf = null;
      }
    }

    if (payload.phone !== undefined) {
      updateData.phone = payload.phone ? this.validatePhone(payload.phone) : null;
    }

    if (payload.birthDate !== undefined) {
      updateData.birthDate = payload.birthDate ? this.validateDate(payload.birthDate).toISOString().split('T')[0] : null;
    }

    if (payload.address !== undefined) {
      updateData.address = payload.address?.trim() || null;
    }

    if (payload.zipCode !== undefined) {
      updateData.zipCode = payload.zipCode ? this.validateZipCode(payload.zipCode) : null;
    }

    if (payload.enrollmentNumber !== undefined) {
      if (payload.enrollmentNumber) {
        const enrollmentNumber = this.validateEnrollmentNumber(payload.enrollmentNumber);
        const existingByEnrollment = await this.repository.findByEnrollmentNumber(enrollmentNumber);
        if (existingByEnrollment && existingByEnrollment.id !== id) {
          throw new StudentConflictError(`Student with enrollment number "${enrollmentNumber}" already exists`);
        }
        updateData.enrollmentNumber = enrollmentNumber;
      } else {
        updateData.enrollmentNumber = null;
      }
    }

    if (payload.instagram !== undefined) {
      updateData.instagram = payload.instagram ? this.validateSocialHandle(payload.instagram) : null;
    }

    if (payload.twitter !== undefined) {
      updateData.twitter = payload.twitter ? this.validateSocialHandle(payload.twitter) : null;
    }

    if (payload.courseIds !== undefined) {
      const courseIds = this.validateCourseIds(payload.courseIds);
      const courses = await this.fetchCourses(courseIds);
      if (courses.length !== courseIds.length) {
        throw new StudentValidationError('Um ou mais cursos selecionados são inválidos.');
      }
      updateData.courseIds = courseIds;
    }

    if (payload.temporaryPassword !== undefined) {
      if (!payload.temporaryPassword) {
        throw new StudentValidationError('A senha temporária não pode ser vazia.');
      }
      const sanitizedPassword = payload.temporaryPassword.trim();
      if (sanitizedPassword.length < 8) {
        throw new StudentValidationError('A senha temporária deve ter pelo menos 8 caracteres.');
      }

      await this.updateAuthPassword(id, sanitizedPassword, true);
      updateData.temporaryPassword = sanitizedPassword;
      updateData.mustChangePassword = true;
    }

    return this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.repository.delete(id);
  }

  async getById(id: string): Promise<Student> {
    return this.ensureExists(id);
  }

  private validateFullName(fullName?: string): string {
    const trimmed = fullName?.trim();
    if (!trimmed) {
      throw new StudentValidationError('Full name cannot be empty');
    }

    if (trimmed.length < FULL_NAME_MIN_LENGTH) {
      throw new StudentValidationError(
        `Full name must have at least ${FULL_NAME_MIN_LENGTH} characters`,
      );
    }

    if (trimmed.length > FULL_NAME_MAX_LENGTH) {
      throw new StudentValidationError(
        `Full name must have at most ${FULL_NAME_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private validateEmail(email?: string): string {
    const trimmed = email?.trim().toLowerCase();
    if (!trimmed) {
      throw new StudentValidationError('Email is required');
    }

    if (trimmed.length > EMAIL_MAX_LENGTH) {
      throw new StudentValidationError(`Email must have at most ${EMAIL_MAX_LENGTH} characters`);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new StudentValidationError('Invalid email format');
    }

    return trimmed;
  }

  private validateCpf(cpf?: string): string {
    const cleaned = cpf?.replace(/\D/g, '');
    if (!cleaned || cleaned.length !== CPF_LENGTH) {
      throw new StudentValidationError(`CPF must have exactly ${CPF_LENGTH} digits`);
    }

    return cleaned;
  }

  private validatePhone(phone?: string): string {
    const cleaned = phone?.replace(/\D/g, '');
    if (!cleaned) {
      throw new StudentValidationError('Phone cannot be empty');
    }

    if (cleaned.length < PHONE_MIN_LENGTH || cleaned.length > PHONE_MAX_LENGTH) {
      throw new StudentValidationError(
        `Phone must have between ${PHONE_MIN_LENGTH} and ${PHONE_MAX_LENGTH} digits`,
      );
    }

    return cleaned;
  }

  private validateZipCode(zipCode?: string): string {
    const cleaned = zipCode?.replace(/\D/g, '');
    if (!cleaned || cleaned.length !== ZIP_CODE_LENGTH) {
      throw new StudentValidationError(`ZIP code must have exactly ${ZIP_CODE_LENGTH} digits`);
    }

    return cleaned;
  }

  private validateEnrollmentNumber(enrollmentNumber?: string): string {
    const trimmed = enrollmentNumber?.trim();
    if (!trimmed) {
      throw new StudentValidationError('Enrollment number cannot be empty');
    }

    if (trimmed.length > ENROLLMENT_NUMBER_MAX_LENGTH) {
      throw new StudentValidationError(
        `Enrollment number must have at most ${ENROLLMENT_NUMBER_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private validateSocialHandle(handle?: string): string {
    const trimmed = handle?.trim();
    if (!trimmed) {
      throw new StudentValidationError('Social handle cannot be empty');
    }

    if (trimmed.length > SOCIAL_HANDLE_MAX_LENGTH) {
      throw new StudentValidationError(
        `Social handle must have at most ${SOCIAL_HANDLE_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  }

  private validateDate(dateString?: string): Date {
    if (!dateString) {
      throw new StudentValidationError('Date is required');
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new StudentValidationError('Invalid date format');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
      throw new StudentValidationError('Birth date cannot be in the future');
    }

    return date;
  }

  private async ensureExists(id: string): Promise<Student> {
    const student = await this.repository.findById(id);
    if (!student) {
      throw new StudentNotFoundError(`Student with id "${id}" was not found`);
    }

    return student;
  }

  private validateCourseIds(courseIds?: string[]): string[] {
    if (!courseIds || courseIds.length < COURSE_MIN_SELECTION) {
      throw new StudentValidationError('Selecione pelo menos um curso para o aluno.');
    }

    const unique = Array.from(new Set(courseIds));
    const sanitized = unique.map((id) => id.trim()).filter(Boolean);

    if (!sanitized.length) {
      throw new StudentValidationError('Selecione pelo menos um curso para o aluno.');
    }

    return sanitized;
  }

  private async fetchCourses(courseIds: string[]): Promise<{ id: string; name: string }[]> {
    if (!courseIds.length) {
      return [];
    }

    const { data, error } = await getAdminClient()
      .from('cursos')
      .select('id, nome')
      .in('id', courseIds);

    if (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }

    return (
      data?.map((course) => ({
        id: course.id,
        name: course.nome,
      })) ?? []
    );
  }

  private generateDefaultPassword(cpf: string, courseName: string): string {
    const sanitizedCourse = courseName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, COURSE_NAME_MAX_LENGTH_FOR_PASSWORD)
      .toUpperCase();

    return `${cpf}@${sanitizedCourse}`;
  }

  private async updateAuthPassword(
    userId: string,
    newPassword: string,
    mustChangePassword: boolean,
  ): Promise<void> {
    const { error } = await getAdminClient().auth.admin.updateUserById(userId, {
      password: newPassword,
      user_metadata: {
        must_change_password: mustChangePassword,
      },
    });

    if (error) {
      throw new Error(`Failed to update auth password: ${error.message}`);
    }
  }
}

