import type { SupabaseClient } from "@supabase/supabase-js";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { StudentService, createStudentService } from "./student.service";
import { StudentConflictError, StudentValidationError } from "./errors";

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

export type StudentImportRowStatus = "created" | "skipped" | "failed";

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
  "fullName",
  "email",
  "enrollmentNumber",
];

function normalizeCpf(rawCpf: string): string {
  const digits = (rawCpf ?? "").replace(/\D/g, "");
  // Regra: se vier com 8, 9 ou 10 dígitos, completa com 0 à esquerda até 11.
  if (digits.length >= 8 && digits.length <= 10) return digits.padStart(11, "0");
  return digits;
}

export class StudentImportService {
  constructor(
    private readonly studentService: StudentService,
    private readonly client = getDatabaseClient(),
  ) {}

  async import(
    rows: StudentImportInputRow[],
    options?: { empresaId?: string | null },
  ): Promise<StudentImportSummary> {
    if (!rows || rows.length === 0) {
      throw new StudentValidationError(
        "Nenhum aluno encontrado para importação.",
      );
    }

    const empresaId = options?.empresaId ?? undefined;

    const courseLookup = await this.buildCourseLookup(
      options?.empresaId ?? null,
    );

    const summary: StudentImportSummary = {
      total: rows.length,
      created: 0,
      skipped: 0,
      failed: 0,
      rows: [],
    };

    // Fase 1: Validar todos os registros primeiro
    const validatedRows: Array<{
      row: StudentImportInputRow;
      courseIds: string[];
      errors: string[];
    }> = [];

    for (const row of rows) {
      const normalizedCpf = normalizeCpf(row.cpf);
      const normalizedRow: StudentImportInputRow = {
        ...row,
        cpf: normalizedCpf,
        // Regra: se não vier senha, usar o CPF (11 dígitos).
        temporaryPassword:
          row.temporaryPassword?.trim() ||
          (normalizedCpf.length === 11 ? normalizedCpf : ""),
      };

      const errors = this.validateRow(normalizedRow);
      const courseIds = this.resolveCourses(normalizedRow, courseLookup, errors);

      validatedRows.push({ row: normalizedRow, courseIds, errors });

      if (errors.length > 0) {
        summary.failed += 1;
        summary.rows.push({
          rowNumber: normalizedRow.rowNumber,
          email: normalizedRow.email,
          status: "failed",
          message: errors.join(" | "),
        });
      }
    }

    // Fase 2: Processar registros válidos em lotes
    const validRows = validatedRows.filter((v) => v.errors.length === 0);
    const CONCURRENCY = 20; // concorrência controlada para evitar timeout/limites do provedor

    const processRow = async ({
      row,
      courseIds,
    }: (typeof validatedRows)[number]): Promise<StudentImportRowResult> => {
      try {
        await this.studentService.create({
          empresaId: empresaId || undefined,
          fullName: row.fullName,
          email: row.email,
          cpf: row.cpf,
          phone: row.phone,
          enrollmentNumber: row.enrollmentNumber,
          courseIds,
          temporaryPassword: row.temporaryPassword,
          mustChangePassword: true,
        });

        return {
          rowNumber: row.rowNumber,
          email: row.email,
          status: "created",
        };
      } catch (error) {
        if (error instanceof StudentConflictError) {
          return {
            rowNumber: row.rowNumber,
            email: row.email,
            status: "skipped",
            message: error.message,
          };
        }

        const message =
          error instanceof Error
            ? error.message
            : "Erro inesperado ao importar aluno.";
        return {
          rowNumber: row.rowNumber,
          email: row.email,
          status: "failed",
          message,
        };
      }
    };

    let cursor = 0;
    const processedResults: StudentImportRowResult[] = [];

    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < validRows.length) {
        const currentIndex = cursor;
        cursor += 1;
        const item = validRows[currentIndex];
        if (!item) return;
        const result = await processRow(item);
        processedResults.push(result);
      }
    });

    await Promise.allSettled(workers);

    processedResults.forEach((rowResult) => {
      if (rowResult.status === "created") summary.created += 1;
      else if (rowResult.status === "skipped") summary.skipped += 1;
      else summary.failed += 1;
      summary.rows.push(rowResult);
    });

    return summary;
  }

  private async buildCourseLookup(
    empresaId?: string | null,
  ): Promise<Map<string, CourseRow>> {
    let query = this.client.from("cursos").select("id, nome");
    if (empresaId) {
      query = query.eq("empresa_id", empresaId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Erro ao carregar cursos para importação: ${error.message}`,
      );
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
    return (name ?? "").trim().toLowerCase();
  }

  private validateRow(row: StudentImportInputRow): string[] {
    const errors: string[] = [];

    REQUIRED_FIELDS.forEach((field) => {
      const value = row[field];
      if (typeof value === "string") {
        if (!value.trim()) {
          errors.push(`Campo obrigatório "${field}" ausente.`);
        }
      } else if (value == null) {
        errors.push(`Campo obrigatório "${field}" ausente.`);
      }
    });

    // CPF passa a ser opcional quando houver senha temporária (importação em massa).
    // Regras:
    // - se CPF vier com 8-10 dígitos, já foi normalizado para 11 no início do fluxo.
    // - se CPF vier preenchido, deve ficar com 11 dígitos após normalização.
    // - se CPF estiver vazio, exige senha temporária preenchida (para permitir login).
    const cpfTrimmed = (row.cpf ?? "").trim();
    const tempPasswordTrimmed = (row.temporaryPassword ?? "").trim();

    if (!cpfTrimmed && !tempPasswordTrimmed) {
      errors.push("Informe o CPF ou a senha temporária do aluno.");
    }

    if (cpfTrimmed && normalizeCpf(cpfTrimmed).length !== 11) {
      errors.push("CPF deve ter 11 dígitos.");
    }

    if (!row.courses || row.courses.length === 0) {
      errors.push("Informe pelo menos um curso para cada aluno.");
    }

    if (row.temporaryPassword && row.temporaryPassword.length < 8) {
      errors.push("A senha temporária deve ter pelo menos 8 caracteres.");
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
      errors.push(`Cursos não encontrados: ${unknownCourses.join(", ")}`);
    }

    if (courseIds.length === 0) {
      errors.push("Nenhum curso válido encontrado para este aluno.");
    }

    return courseIds;
  }
}

export function createStudentImportService(
  client: SupabaseClient,
): StudentImportService {
  const studentService = createStudentService(client);
  return new StudentImportService(studentService);
}
