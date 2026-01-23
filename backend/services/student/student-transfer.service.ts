import type {
  BulkTransferResult,
  BulkTransferCourseRequest,
  BulkTransferTurmaRequest,
  TransferResult,
  StudentSummary,
  TurmaSummary,
  CourseSummary,
} from "./student-transfer.types";
import type { StudentTransferRepository } from "./student-transfer.repository";

const MAX_STUDENTS_PER_REQUEST = 100;
const BATCH_SIZE = 10;

export class StudentTransferService {
  constructor(private readonly repository: StudentTransferRepository) {}

  async bulkTransferBetweenCourses(
    request: BulkTransferCourseRequest
  ): Promise<BulkTransferResult> {
    const { studentIds, sourceCourseId, targetCourseId } = request;

    // Validations
    if (!studentIds || studentIds.length === 0) {
      throw new Error("Selecione pelo menos um aluno");
    }

    if (studentIds.length > MAX_STUDENTS_PER_REQUEST) {
      throw new Error(`Maximo de ${MAX_STUDENTS_PER_REQUEST} alunos por transferencia`);
    }

    if (sourceCourseId === targetCourseId) {
      throw new Error("Origem e destino devem ser diferentes");
    }

    // Verify courses exist
    const sourceCourse = await this.repository.getCourseInfo(sourceCourseId);
    if (!sourceCourse) {
      throw new Error("Curso de origem nao encontrado");
    }

    const targetCourse = await this.repository.getCourseInfo(targetCourseId);
    if (!targetCourse) {
      throw new Error("Curso de destino nao encontrado");
    }

    // Check which students are in source course
    const studentsInSource = await this.repository.checkStudentsInCourse(
      studentIds,
      sourceCourseId
    );

    // Check which students are already in target course
    const studentsInTarget = await this.repository.checkStudentsInCourse(
      studentIds,
      targetCourseId
    );

    const results: TransferResult[] = [];

    // Process in batches
    for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
      const batch = studentIds.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (studentId) => {
          // Check if student is in source
          if (!studentsInSource.has(studentId)) {
            const studentName = await this.repository.getStudentName(studentId);
            return {
              studentId,
              studentName,
              status: "skipped" as const,
              message: "Aluno nao esta matriculado no curso de origem",
            };
          }

          // Check if student is already in target
          if (studentsInTarget.has(studentId)) {
            const studentName = await this.repository.getStudentName(studentId);
            return {
              studentId,
              studentName,
              status: "skipped" as const,
              message: "Aluno ja esta matriculado no curso de destino",
            };
          }

          // Transfer student
          return this.repository.transferStudentToCourse(
            studentId,
            sourceCourseId,
            targetCourseId
          );
        })
      );

      results.push(...batchResults);
    }

    return this.summarizeResults(results);
  }

  async bulkTransferBetweenTurmas(
    request: BulkTransferTurmaRequest
  ): Promise<BulkTransferResult> {
    const {
      studentIds,
      sourceTurmaId,
      targetTurmaId,
      sourceStatusOnTransfer = "concluido",
    } = request;

    // Validations
    if (!studentIds || studentIds.length === 0) {
      throw new Error("Selecione pelo menos um aluno");
    }

    if (studentIds.length > MAX_STUDENTS_PER_REQUEST) {
      throw new Error(`Maximo de ${MAX_STUDENTS_PER_REQUEST} alunos por transferencia`);
    }

    if (sourceTurmaId === targetTurmaId) {
      throw new Error("Origem e destino devem ser diferentes");
    }

    // Verify turmas exist and are in same course
    const validation = await this.repository.validateTurmasSameCourse(
      sourceTurmaId,
      targetTurmaId
    );

    if (!validation.valid) {
      throw new Error("As turmas devem pertencer ao mesmo curso");
    }

    // Verify turmas exist
    const sourceTurma = await this.repository.getTurmaInfo(sourceTurmaId);
    if (!sourceTurma) {
      throw new Error("Turma de origem nao encontrada");
    }

    const targetTurma = await this.repository.getTurmaInfo(targetTurmaId);
    if (!targetTurma) {
      throw new Error("Turma de destino nao encontrada");
    }

    // Check which students are in source turma
    const studentsInSource = await this.repository.checkStudentsInTurma(
      studentIds,
      sourceTurmaId
    );

    // Check which students are already in target turma
    const studentsInTarget = await this.repository.checkStudentsInTurma(
      studentIds,
      targetTurmaId
    );

    const results: TransferResult[] = [];

    // Process in batches
    for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
      const batch = studentIds.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (studentId) => {
          // Check if student is in source
          if (!studentsInSource.has(studentId)) {
            const studentName = await this.repository.getStudentName(studentId);
            return {
              studentId,
              studentName,
              status: "skipped" as const,
              message: "Aluno nao esta ativo na turma de origem",
            };
          }

          // Check if student is already in target
          if (studentsInTarget.has(studentId)) {
            const studentName = await this.repository.getStudentName(studentId);
            return {
              studentId,
              studentName,
              status: "skipped" as const,
              message: "Aluno ja esta ativo na turma de destino",
            };
          }

          // Transfer student
          return this.repository.transferStudentToTurma(
            studentId,
            sourceTurmaId,
            targetTurmaId,
            sourceStatusOnTransfer
          );
        })
      );

      results.push(...batchResults);
    }

    return this.summarizeResults(results);
  }

  async getStudentsByCourse(courseId: string): Promise<StudentSummary[]> {
    return this.repository.getStudentsByCourse(courseId);
  }

  async getStudentsByTurma(turmaId: string): Promise<StudentSummary[]> {
    return this.repository.getStudentsByTurma(turmaId);
  }

  async getTurmasByCourse(courseId: string): Promise<TurmaSummary[]> {
    return this.repository.getTurmasByCourse(courseId);
  }

  async getCoursesByEmpresa(empresaId: string): Promise<CourseSummary[]> {
    return this.repository.getCoursesByEmpresa(empresaId);
  }

  private summarizeResults(results: TransferResult[]): BulkTransferResult {
    const success = results.filter((r) => r.status === "success").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "skipped").length;

    return {
      total: results.length,
      success,
      failed,
      skipped,
      results,
    };
  }
}
