import { getDatabaseClient } from '@/backend/clients/database';
import { StudentService } from './student.service';
import {
  StudentConflictError,
  StudentValidationError,
} from './errors';

type CourseRow = {
  id: string;
  nome: string;
};

export interface StudentImportInputRow {
  rowNumber: number;
  fullName: string;
  email: string;
  cpf: string;
  phone: string;
  enrollmentNumber: string;
  courses: string[];
  temporaryPassword: string;
}

export type StudentImportRowStatus = 'created' | 'skipped' | 'failed';

export interface StudentImportRowResult {
  rowNumber: number;
  email: string;
  status: StudentImportRowStatus;
  message?: string;
}

export interface StudentImportSummary {
  total: number;
  created: number;
  skipped: number;
  failed: number;
  rows: StudentImportRowResult[];
}

const REQUIRED_FIELDS: Array<keyof StudentImportInputRow> = [
  'fullName',
  'email',
  'cpf',
  'phone',
  'enrollmentNumber',
  'temporaryPassword',
];

export class StudentImportService {
  constructor(
    private readonly studentService: StudentService,
    private readonly client = getDatabaseClient(),
  ) {}

  async import(rows: StudentImportInputRow[]): Promise<StudentImportSummary> {
    if (!rows || rows.length === 0) {
      throw new StudentValidationError('Nenhum aluno encontrado para importação.');
    }

    const courseLookup = await this.buildCourseLookup();

    const summary: StudentImportSummary = {
      total: rows.length,
      created: 0,
      skipped: 0,
      failed: 0,
      rows: [],
    };

    for (const row of rows) {
      const errors = this.validateRow(row);

      const courseIds = this.resolveCourses(row, courseLookup, errors);

      if (errors.length > 0) {
        summary.failed += 1;
        summary.rows.push({
          rowNumber: row.rowNumber,
          email: row.email,
          status: 'failed',
          message: errors.join(' | '),
        });
        continue;
      }

      try {
        await this.studentService.create({
          fullName: row.fullName,
          email: row.email,
          cpf: row.cpf,
          phone: row.phone,
          enrollmentNumber: row.enrollmentNumber,
          courseIds,
          temporaryPassword: row.temporaryPassword,
          mustChangePassword: true,
        });

        summary.created += 1;
        summary.rows.push({
          rowNumber: row.rowNumber,
          email: row.email,
          status: 'created',
        });
      } catch (error) {
        if (error instanceof StudentConflictError) {
          summary.skipped += 1;
          summary.rows.push({
            rowNumber: row.rowNumber,
            email: row.email,
            status: 'skipped',
            message: error.message,
          });
          continue;
        }

        const message =
          error instanceof Error ? error.message : 'Erro inesperado ao importar aluno.';
        summary.failed += 1;
        summary.rows.push({
          rowNumber: row.rowNumber,
          email: row.email,
          status: 'failed',
          message,
        });
      }
    }

    return summary;
  }

  private async buildCourseLookup(): Promise<Map<string, CourseRow>> {
    const { data, error } = await this.client
      .from('cursos')
      .select('id, nome');

    if (error) {
      throw new Error(`Erro ao carregar cursos para importação: ${error.message}`);
    }

    const map = new Map<string, CourseRow>();
    (data ?? []).forEach((course) => {
      const key = this.normalizeCourseName(course.nome);
      if (!map.has(key)) {
        map.set(key, course);
      }
    });

    return map;
  }

  private normalizeCourseName(name?: string | null): string {
    return (name ?? '').trim().toLowerCase();
  }

  private validateRow(row: StudentImportInputRow): string[] {
    const errors: string[] = [];

    REQUIRED_FIELDS.forEach((field) => {
      const value = row[field];
      if (typeof value === 'string') {
        if (!value.trim()) {
          errors.push(`Campo obrigatório "${field}" ausente.`);
        }
      } else if (value == null) {
        errors.push(`Campo obrigatório "${field}" ausente.`);
      }
    });

    if (!row.courses || row.courses.length === 0) {
      errors.push('Informe pelo menos um curso para cada aluno.');
    }

    if (row.temporaryPassword && row.temporaryPassword.length < 8) {
      errors.push('A senha temporária deve ter pelo menos 8 caracteres.');
    }

    return errors;
  }

  private resolveCourses(
    row: StudentImportInputRow,
    lookup: Map<string, CourseRow>,
    errors: string[],
  ): string[] {
    const courseIds: string[] = [];
    const unknownCourses: string[] = [];

    for (const courseName of row.courses || []) {
      const normalized = this.normalizeCourseName(courseName);
      if (!normalized) {
        continue;
      }

      const course = lookup.get(normalized);
      if (!course) {
        unknownCourses.push(courseName);
        continue;
      }

      if (!courseIds.includes(course.id)) {
        courseIds.push(course.id);
      }
    }

    if (unknownCourses.length > 0) {
      errors.push(`Cursos não encontrados: ${unknownCourses.join(', ')}`);
    }

    if (courseIds.length === 0) {
      errors.push('Nenhum curso válido encontrado para este aluno.');
    }

    return courseIds;
  }
}


