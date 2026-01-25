import { createClient } from "@/lib/client";
import { Curso, Disciplina, Frente, Modulo, Flashcard } from "../types";

export class FlashcardsService {
  private supabase = createClient();

  private async fetchWithAuth(input: string, init?: RequestInit) {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    if (!session) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const headers = new Headers(init?.headers || {});
    if (!(init?.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("Authorization", `Bearer ${session.access_token}`);

    return fetch(input, {
      ...init,
      headers,
    });
  }

  async getFlashcards(
    modoSelecionado: string,
    scopeSelecionado: "all" | "completed",
    cursoId?: string,
    frenteId?: string,
    moduloId?: string,
    excludeIds?: string[],
  ): Promise<Flashcard[]> {
    let url = `/api/flashcards/revisao?modo=${modoSelecionado}&scope=${scopeSelecionado}`;
    if (cursoId) url += `&cursoId=${cursoId}`;
    if (frenteId) url += `&frenteId=${frenteId}`;
    if (moduloId) url += `&moduloId=${moduloId}`;

    if (excludeIds && excludeIds.length > 0) {
      url += `&excludeIds=${excludeIds.join(",")}`;
    }

    const res = await this.fetchWithAuth(url);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error || "Não foi possível carregar os flashcards");
    }

    return body.data || [];
  }

  async submitFeedback(cardId: string, feedback: number): Promise<void> {
    await this.fetchWithAuth("/api/flashcards/feedback", {
      method: "POST",
      body: JSON.stringify({ cardId, feedback }),
    });
  }

  async getCursos(): Promise<Curso[]> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) return [];

    // Verificar se é professor
    const { data: professorData } = await this.supabase
      .from("professores")
      .select("id")
      .eq("id", user.id)
      .maybeSingle<{ id: string }>();

    const isProfessor = !!professorData;
    const role = (user.user_metadata?.role as string) || "aluno";
    const isSuperAdmin =
      role === "superadmin" || user.user_metadata?.is_superadmin === true;

    if (isProfessor || isSuperAdmin) {
      const { data: cursos, error } = await this.supabase
        .from("cursos")
        .select("id, nome")
        .order("nome", { ascending: true })
        .returns<Curso[]>();

      if (error) throw error;
      return (cursos || []).map((c) => ({ id: c.id, nome: c.nome }));
    } else {
      const { data: alunosCursos, error: alunosCursosError } =
        await this.supabase
          .from("alunos_cursos")
          .select("curso_id")
          .eq("aluno_id", user.id)
          .returns<Array<{ curso_id: string }>>();

      if (alunosCursosError) throw alunosCursosError;

      if (alunosCursos && alunosCursos.length > 0) {
        const cursoIds = alunosCursos.map((ac) => ac.curso_id);
        const { data: cursos, error: cursosError } = await this.supabase
          .from("cursos")
          .select("id, nome")
          .in("id", cursoIds)
          .order("nome", { ascending: true })
          .returns<Curso[]>();

        if (cursosError) throw cursosError;
        return (cursos || []).map((c) => ({ id: c.id, nome: c.nome }));
      }
      return [];
    }
  }

  async getDisciplinas(cursoId: string): Promise<Disciplina[]> {
    const { data: cursosDisciplinas, error } = await this.supabase
      .from("cursos_disciplinas")
      .select("disciplina:disciplina_id ( id, nome )")
      .eq("curso_id", cursoId)
      .returns<Array<{ disciplina: { id: string; nome: string } | null }>>();

    if (error) throw error;

    if (cursosDisciplinas) {
      const disciplinasData = cursosDisciplinas
        .map((cd) => cd.disciplina)
        .filter((d): d is { id: string; nome: string } => d !== null)
        .map((d) => ({ id: d.id, nome: d.nome }));

      const unique = Array.from(
        new Map(disciplinasData.map((d) => [d.id, d])).values(),
      );
      return unique;
    }
    return [];
  }

  async getFrentes(cursoId: string, disciplinaId: string): Promise<Frente[]> {
    const { data: frentesData, error } = await this.supabase
      .from("frentes")
      .select("id, nome, disciplina_id, curso_id")
      .eq("disciplina_id", disciplinaId)
      .eq("curso_id", cursoId)
      .order("nome", { ascending: true })
      .returns<
        Array<{
          id: string;
          nome: string;
          disciplina_id: string;
          curso_id: string | null;
        }>
      >();

    if (error) throw error;

    return (frentesData ?? []).map((f) => ({
      id: f.id,
      nome: f.nome,
      disciplina_id: f.disciplina_id,
    }));
  }

  async getModulos(cursoId: string, frenteId: string): Promise<Modulo[]> {
    const { data: modulosData, error } = await this.supabase
      .from("modulos")
      .select("id, nome, numero_modulo, frente_id")
      .eq("frente_id", frenteId)
      .or(`curso_id.eq.${cursoId},curso_id.is.null`)
      .order("numero_modulo", { ascending: true, nullsFirst: false })
      .returns<
        Array<{
          id: string;
          nome: string;
          numero_modulo: number | null;
          frente_id: string;
        }>
      >();

    if (error) throw error;

    return (modulosData ?? []).map((m) => ({
      id: m.id,
      nome: m.nome,
      numero_modulo: m.numero_modulo,
      frente_id: m.frente_id,
    }));
  }
}

export const flashcardsService = new FlashcardsService();
