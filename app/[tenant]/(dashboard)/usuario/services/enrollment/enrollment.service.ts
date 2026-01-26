import {
  Enrollment,
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
} from './enrollment.types';
import {
  EnrollmentRepository,
} from './enrollment.repository';
import {
  EnrollmentConflictError,
  EnrollmentNotFoundError,
  EnrollmentValidationError,
} from './errors';

export class EnrollmentService {
  constructor(private readonly repository: EnrollmentRepository) {}

  async list(): Promise<Enrollment[]> {
    return this.repository.list();
  }

  async listByStudent(studentId: string): Promise<Enrollment[]> {
    return this.repository.findByStudentId(studentId);
  }

  async listByCourse(courseId: string): Promise<Enrollment[]> {
    return this.repository.findByCourseId(courseId);
  }

  async create(payload: CreateEnrollmentInput): Promise<Enrollment> {
    await this.ensureStudentExists(payload.studentId);
    await this.ensureCourseExists(payload.courseId);

    const accessStartDate = payload.accessStartDate
      ? this.validateDate(payload.accessStartDate)
      : new Date();
    const accessEndDate = this.validateDate(payload.accessEndDate);

    if (accessStartDate >= accessEndDate) {
      throw new EnrollmentValidationError('Access start date must be before end date');
    }

    // Verificar se já existe matrícula ativa para este aluno e curso
    const existing = await this.repository.findActiveByStudentAndCourse(
      payload.studentId,
      payload.courseId,
    );
    if (existing) {
      throw new EnrollmentConflictError(
        `Active enrollment already exists for this student and course`,
      );
    }

    return this.repository.create({
      studentId: payload.studentId,
      courseId: payload.courseId,
      accessStartDate: accessStartDate.toISOString().split('T')[0],
      accessEndDate: accessEndDate.toISOString().split('T')[0],
      active: payload.active ?? true,
    });
  }

  async update(id: string, payload: UpdateEnrollmentInput): Promise<Enrollment> {
    const enrollment = await this.ensureExists(id);

    const updateData: UpdateEnrollmentInput = {};

    if (payload.accessStartDate !== undefined) {
      updateData.accessStartDate = this.validateDate(payload.accessStartDate).toISOString();
    }

    if (payload.accessEndDate !== undefined) {
      updateData.accessEndDate = this.validateDate(payload.accessEndDate).toISOString();
    }

    if (payload.active !== undefined) {
      updateData.active = payload.active;
    }

    // Validar datas se ambas foram fornecidas
    if (updateData.accessStartDate && updateData.accessEndDate) {
      const startDate = new Date(updateData.accessStartDate);
      const endDate = new Date(updateData.accessEndDate);
      if (startDate >= endDate) {
        throw new EnrollmentValidationError('Access start date must be before end date');
      }
    } else if (updateData.accessStartDate) {
      const startDate = new Date(updateData.accessStartDate);
      if (startDate >= enrollment.accessEndDate) {
        throw new EnrollmentValidationError('Access start date must be before end date');
      }
    } else if (updateData.accessEndDate) {
      const endDate = new Date(updateData.accessEndDate);
      if (enrollment.accessStartDate >= endDate) {
        throw new EnrollmentValidationError('Access start date must be before end date');
      }
    }

    return this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.repository.delete(id);
  }

  async getById(id: string): Promise<Enrollment> {
    return this.ensureExists(id);
  }

  private validateDate(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new EnrollmentValidationError('Invalid date format');
    }
    return date;
  }

  private async ensureExists(id: string): Promise<Enrollment> {
    const enrollment = await this.repository.findById(id);
    if (!enrollment) {
      throw new EnrollmentNotFoundError(`Enrollment with id "${id}" was not found`);
    }
    return enrollment;
  }

  private async ensureStudentExists(studentId: string): Promise<void> {
    const exists = await this.repository.studentExists(studentId);
    if (!exists) {
      throw new EnrollmentValidationError(`Student with id "${studentId}" does not exist`);
    }
  }

  private async ensureCourseExists(courseId: string): Promise<void> {
    const exists = await this.repository.courseExists(courseId);
    if (!exists) {
      throw new EnrollmentValidationError(`Course with id "${courseId}" does not exist`);
    }
  }
}

