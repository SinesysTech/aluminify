import {
  Student,
  CreateStudentInput,
  UpdateStudentInput,
} from './student.types';
import {
  StudentRepository,
} from './student.repository';
import {
  StudentConflictError,
  StudentNotFoundError,
  StudentValidationError,
} from './errors';

const FULL_NAME_MIN_LENGTH = 3;
const FULL_NAME_MAX_LENGTH = 200;
const EMAIL_MAX_LENGTH = 255;
const CPF_LENGTH = 11;
const PHONE_MIN_LENGTH = 10;
const PHONE_MAX_LENGTH = 15;
const ZIP_CODE_LENGTH = 8;
const ENROLLMENT_NUMBER_MAX_LENGTH = 50;
const SOCIAL_HANDLE_MAX_LENGTH = 100;

export class StudentService {
  constructor(private readonly repository: StudentRepository) {}

  async list(): Promise<Student[]> {
    return this.repository.list();
  }

  async create(payload: CreateStudentInput): Promise<Student> {
    const email = this.validateEmail(payload.email);
    
    const existingByEmail = await this.repository.findByEmail(email);
    if (existingByEmail) {
      throw new StudentConflictError(`Student with email "${email}" already exists`);
    }

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

    const fullName = payload.fullName ? this.validateFullName(payload.fullName) : null;
    const phone = payload.phone ? this.validatePhone(payload.phone) : null;
    const zipCode = payload.zipCode ? this.validateZipCode(payload.zipCode) : null;
    const birthDate = payload.birthDate ? this.validateDate(payload.birthDate) : null;
    const instagram = payload.instagram ? this.validateSocialHandle(payload.instagram) : null;
    const twitter = payload.twitter ? this.validateSocialHandle(payload.twitter) : null;

    return this.repository.create({
      id: payload.id,
      fullName,
      email,
      cpf: payload.cpf ? this.validateCpf(payload.cpf) : null,
      phone,
      birthDate,
      address: payload.address?.trim() || null,
      zipCode,
      enrollmentNumber: payload.enrollmentNumber ? this.validateEnrollmentNumber(payload.enrollmentNumber) : null,
      instagram,
      twitter,
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
      updateData.birthDate = payload.birthDate ? this.validateDate(payload.birthDate) : null;
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
}

