import { SupabaseClient } from "@supabase/supabase-js";

export interface StudentTransferRepository {
  getTurmasByCourse(courseId: string): Promise<any[]>;
  getStudentsByCourse(courseId: string): Promise<any[]>;
  getStudentsByTurma(turmaId: string): Promise<any[]>;
  transferBetweenCourses(params: {
    studentIds: string[];
    sourceCourseId: string;
    targetCourseId: string;
    options?: any;
  }): Promise<void>;
  transferBetweenTurmas(params: {
    studentIds: string[];
    sourceTurmaId: string;
    targetTurmaId: string;
    sourceStatusOnTransfer?: string;
  }): Promise<void>;
}

export class StudentTransferRepositoryImpl implements StudentTransferRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getTurmasByCourse(courseId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from("turmas")
      .select("*")
      .eq("curso_id", courseId);

    if (error) throw error;
    return data || [];
  }

  async getStudentsByCourse(courseId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from("matriculas")
      .select("aluno:usuarios(*)")
      .eq("curso_id", courseId);

    if (error) throw error;
    return data?.map((m) => m.aluno) || [];
  }

  async getStudentsByTurma(turmaId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from("matriculas_turmas")
      .select("aluno:usuarios(*)")
      .eq("turma_id", turmaId);

    if (error) throw error;
    return data?.map((m) => m.aluno) || [];
  }

  async transferBetweenCourses(params: {
    studentIds: string[];
    sourceCourseId: string;
    targetCourseId: string;
    options?: any;
  }): Promise<void> {
    // Implementação simplificada de transferência
    const { error } = await this.client.rpc("transfer_students_course", {
      p_student_ids: params.studentIds,
      p_source_course_id: params.sourceCourseId,
      p_target_course_id: params.targetCourseId,
      p_options: params.options,
    });

    if (error) throw error;
  }

  async transferBetweenTurmas(params: {
    studentIds: string[];
    sourceTurmaId: string;
    targetTurmaId: string;
    sourceStatusOnTransfer?: string;
  }): Promise<void> {
    const { error } = await this.client.rpc("transfer_students_turma", {
      p_student_ids: params.studentIds,
      p_source_turma_id: params.sourceTurmaId,
      p_target_turma_id: params.targetTurmaId,
      p_source_status: params.sourceStatusOnTransfer,
    });

    if (error) throw error;
  }
}
