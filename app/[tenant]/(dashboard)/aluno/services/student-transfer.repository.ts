import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/app/shared/core/database.types";
import type {
  TransferResult,
  StudentSummary,
  TurmaSummary,
  CourseSummary,
  TurmaStatus,
} from "./student-transfer.types";

const ALUNOS_TABLE = "alunos";
const ALUNOS_CURSOS_TABLE = "alunos_cursos";
const ALUNOS_TURMAS_TABLE = "alunos_turmas";
const TURMAS_TABLE = "turmas";
const CURSOS_TABLE = "cursos";

type AlunoRow = Database["public"]["Tables"]["alunos"]["Row"];
type TurmaRow = Database["public"]["Tables"]["turmas"]["Row"];
type CursoRow = Database["public"]["Tables"]["cursos"]["Row"];

export interface StudentTransferRepository {
  getStudentsByCourse(courseId: string): Promise<StudentSummary[]>;
  getStudentsByTurma(turmaId: string): Promise<StudentSummary[]>;
  getTurmasByCourse(courseId: string): Promise<TurmaSummary[]>;
  getCoursesByEmpresa(empresaId: string): Promise<CourseSummary[]>;

  checkStudentsInCourse(studentIds: string[], courseId: string): Promise<Set<string>>;
  checkStudentsInTurma(studentIds: string[], turmaId: string): Promise<Set<string>>;

  validateTurmasSameCourse(turmaId1: string, turmaId2: string): Promise<{ valid: boolean; courseId?: string }>;

  transferStudentToCourse(
    studentId: string,
    sourceCourseId: string,
    targetCourseId: string
  ): Promise<TransferResult>;

  transferStudentToTurma(
    studentId: string,
    sourceTurmaId: string,
    targetTurmaId: string,
    sourceStatus: TurmaStatus
  ): Promise<TransferResult>;

  getStudentName(studentId: string): Promise<string | null>;
  getCourseInfo(courseId: string): Promise<{ id: string; nome: string; empresaId: string } | null>;
  getTurmaInfo(turmaId: string): Promise<{ id: string; nome: string; cursoId: string } | null>;
}

export class StudentTransferRepositoryImpl implements StudentTransferRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getStudentsByCourse(courseId: string): Promise<StudentSummary[]> {
    const { data: links, error: linksError } = await this.client
      .from(ALUNOS_CURSOS_TABLE)
      .select("aluno_id")
      .eq("curso_id", courseId);

    if (linksError) {
      throw new Error(`Failed to fetch students for course: ${linksError.message}`);
    }

    if (!links || links.length === 0) {
      return [];
    }

    const studentIds = links.map((l) => l.aluno_id);

    const { data: students, error: studentsError } = await this.client
      .from(ALUNOS_TABLE)
      .select("id, nome_completo, email")
      .in("id", studentIds)
      .is("deleted_at", null)
      .order("nome_completo", { ascending: true });

    if (studentsError) {
      throw new Error(`Failed to fetch student details: ${studentsError.message}`);
    }

    return (students ?? []).map((s: Pick<AlunoRow, 'id' | 'nome_completo' | 'email'>) => ({
      id: s.id,
      fullName: s.nome_completo,
      email: s.email,
    }));
  }

  async getStudentsByTurma(turmaId: string): Promise<StudentSummary[]> {
    const { data: links, error: linksError } = await this.client
      .from(ALUNOS_TURMAS_TABLE)
      .select("aluno_id")
      .eq("turma_id", turmaId)
      .eq("status", "ativo");

    if (linksError) {
      throw new Error(`Failed to fetch students for turma: ${linksError.message}`);
    }

    if (!links || links.length === 0) {
      return [];
    }

    const studentIds = links.map((l) => l.aluno_id);

    const { data: students, error: studentsError } = await this.client
      .from(ALUNOS_TABLE)
      .select("id, nome_completo, email")
      .in("id", studentIds)
      .is("deleted_at", null)
      .order("nome_completo", { ascending: true });

    if (studentsError) {
      throw new Error(`Failed to fetch student details: ${studentsError.message}`);
    }

    return (students ?? []).map((s: Pick<AlunoRow, 'id' | 'nome_completo' | 'email'>) => ({
      id: s.id,
      fullName: s.nome_completo,
      email: s.email,
    }));
  }

  async getTurmasByCourse(courseId: string): Promise<TurmaSummary[]> {
    const { data, error } = await this.client
      .from(TURMAS_TABLE)
      .select("id, nome, curso_id, ativo")
      .eq("curso_id", courseId)
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch turmas for course: ${error.message}`);
    }

    return (data ?? []).map((t: Pick<TurmaRow, 'id' | 'nome' | 'curso_id' | 'ativo'>) => ({
      id: t.id,
      nome: t.nome,
      cursoId: t.curso_id,
      ativo: t.ativo ?? true,
    }));
  }

  async getCoursesByEmpresa(empresaId: string): Promise<CourseSummary[]> {
    const { data: courses, error: coursesError } = await this.client
      .from(CURSOS_TABLE)
      .select("id, nome")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (coursesError) {
      throw new Error(`Failed to fetch courses: ${coursesError.message}`);
    }

    if (!courses || courses.length === 0) {
      return [];
    }

    const courseIds = courses.map((c) => c.id);

    const { data: turmas, error: turmasError } = await this.client
      .from(TURMAS_TABLE)
      .select("curso_id")
      .in("curso_id", courseIds);

    if (turmasError) {
      throw new Error(`Failed to fetch turmas: ${turmasError.message}`);
    }

    const coursesWithTurmas = new Set((turmas ?? []).map((t) => t.curso_id));

    return courses.map((c: Pick<CursoRow, 'id' | 'nome'>) => ({
      id: c.id,
      nome: c.nome,
      hasTurmas: coursesWithTurmas.has(c.id),
    }));
  }

  async checkStudentsInCourse(studentIds: string[], courseId: string): Promise<Set<string>> {
    const { data, error } = await this.client
      .from(ALUNOS_CURSOS_TABLE)
      .select("aluno_id")
      .eq("curso_id", courseId)
      .in("aluno_id", studentIds);

    if (error) {
      throw new Error(`Failed to check students in course: ${error.message}`);
    }

    return new Set((data ?? []).map((d) => d.aluno_id));
  }

  async checkStudentsInTurma(studentIds: string[], turmaId: string): Promise<Set<string>> {
    const { data, error } = await this.client
      .from(ALUNOS_TURMAS_TABLE)
      .select("aluno_id")
      .eq("turma_id", turmaId)
      .eq("status", "ativo")
      .in("aluno_id", studentIds);

    if (error) {
      throw new Error(`Failed to check students in turma: ${error.message}`);
    }

    return new Set((data ?? []).map((d) => d.aluno_id));
  }

  async validateTurmasSameCourse(
    turmaId1: string,
    turmaId2: string
  ): Promise<{ valid: boolean; courseId?: string }> {
    const { data, error } = await this.client
      .from(TURMAS_TABLE)
      .select("id, curso_id")
      .in("id", [turmaId1, turmaId2]);

    if (error) {
      throw new Error(`Failed to validate turmas: ${error.message}`);
    }

    if (!data || data.length !== 2) {
      return { valid: false };
    }

    const [t1, t2] = data;
    if (t1.curso_id === t2.curso_id) {
      return { valid: true, courseId: t1.curso_id };
    }

    return { valid: false };
  }

  async transferStudentToCourse(
    studentId: string,
    sourceCourseId: string,
    targetCourseId: string
  ): Promise<TransferResult> {
    const studentName = await this.getStudentName(studentId);

    // Remove from source course
    const { error: deleteError } = await this.client
      .from(ALUNOS_CURSOS_TABLE)
      .delete()
      .eq("aluno_id", studentId)
      .eq("curso_id", sourceCourseId);

    if (deleteError) {
      return {
        studentId,
        studentName,
        status: "failed",
        message: `Erro ao remover do curso origem: ${deleteError.message}`,
      };
    }

    // Add to target course
    const { error: insertError } = await this.client
      .from(ALUNOS_CURSOS_TABLE)
      .insert({
        aluno_id: studentId,
        curso_id: targetCourseId,
      });

    if (insertError) {
      // Try to rollback - re-add to source
      await this.client
        .from(ALUNOS_CURSOS_TABLE)
        .insert({
          aluno_id: studentId,
          curso_id: sourceCourseId,
        });

      return {
        studentId,
        studentName,
        status: "failed",
        message: `Erro ao adicionar ao curso destino: ${insertError.message}`,
      };
    }

    return {
      studentId,
      studentName,
      status: "success",
    };
  }

  async transferStudentToTurma(
    studentId: string,
    sourceTurmaId: string,
    targetTurmaId: string,
    sourceStatus: TurmaStatus
  ): Promise<TransferResult> {
    const studentName = await this.getStudentName(studentId);

    // Update source turma record with status and exit date
    const { error: updateError } = await this.client
      .from(ALUNOS_TURMAS_TABLE)
      .update({
        status: sourceStatus,
        data_saida: new Date().toISOString().split("T")[0],
      })
      .eq("aluno_id", studentId)
      .eq("turma_id", sourceTurmaId)
      .eq("status", "ativo");

    if (updateError) {
      return {
        studentId,
        studentName,
        status: "failed",
        message: `Erro ao atualizar turma origem: ${updateError.message}`,
      };
    }

    // Create new record in target turma
    const { error: insertError } = await this.client
      .from(ALUNOS_TURMAS_TABLE)
      .insert({
        aluno_id: studentId,
        turma_id: targetTurmaId,
        status: "ativo",
        data_entrada: new Date().toISOString().split("T")[0],
      });

    if (insertError) {
      // Try to rollback - restore source status
      await this.client
        .from(ALUNOS_TURMAS_TABLE)
        .update({
          status: "ativo",
          data_saida: null,
        })
        .eq("aluno_id", studentId)
        .eq("turma_id", sourceTurmaId);

      return {
        studentId,
        studentName,
        status: "failed",
        message: `Erro ao adicionar na turma destino: ${insertError.message}`,
      };
    }

    return {
      studentId,
      studentName,
      status: "success",
    };
  }

  async getStudentName(studentId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from(ALUNOS_TABLE)
      .select("nome_completo")
      .eq("id", studentId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.nome_completo;
  }

  async getCourseInfo(courseId: string): Promise<{ id: string; nome: string; empresaId: string } | null> {
    const { data, error } = await this.client
      .from(CURSOS_TABLE)
      .select("id, nome, empresa_id")
      .eq("id", courseId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      nome: data.nome,
      empresaId: data.empresa_id,
    };
  }

  async getTurmaInfo(turmaId: string): Promise<{ id: string; nome: string; cursoId: string } | null> {
    const { data, error } = await this.client
      .from(TURMAS_TABLE)
      .select("id, nome, curso_id")
      .eq("id", turmaId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      nome: data.nome,
      cursoId: data.curso_id,
    };
  }
}
