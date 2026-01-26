import { createClient } from "@/app/shared/core/client";
import type { Option, ModuloOption } from "../types";
import { MetodoEstudo, LogPausa } from "@/app/[tenant]/(modules)/sala-de-estudos/types";

export class FocoService {
  private supabase = createClient();

  async getCursos(): Promise<Option[]> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();
    if (error || !user) throw new Error("Usuário não autenticado");

    const role = (user.user_metadata?.role as string) || "aluno";
    const isSuperAdmin =
      role === "superadmin" || user.user_metadata?.is_superadmin === true;

    if (role === "professor" && !isSuperAdmin) {
      const { data, error: cursosError } = await this.supabase
        .from("cursos")
        .select("id, nome")
        .eq("created_by", user.id)
        .order("nome", { ascending: true });

      if (cursosError) throw cursosError;
      return (data || []).map((c) => ({ id: c.id, nome: c.nome }));
    } else if (isSuperAdmin) {
      const { data, error: cursosError } = await this.supabase
        .from("cursos")
        .select("id, nome")
        .order("nome", { ascending: true });

      if (cursosError) throw cursosError;
      return (data || []).map((c) => ({ id: c.id, nome: c.nome }));
    } else {
      const { data, error: acError } = await this.supabase
        .from("alunos_cursos")
        .select("curso_id, cursos(id, nome)")
        .eq("aluno_id", user.id)
        .returns<
          Array<{
            curso_id: string;
            cursos: { id: string; nome: string } | null;
          }>
        >();

      if (acError) throw acError;
      return (data || [])
        .map((ac) => ac.cursos)
        .filter((c): c is { id: string; nome: string } => !!c)
        .map((c) => ({ id: c.id, nome: c.nome }));
    }
  }

  async getDisciplinas(): Promise<Option[]> {
    const { data, error } = await this.supabase
      .from("disciplinas")
      .select("id, nome")
      .order("nome", { ascending: true });

    if (error) throw error;
    return (data || []).map((d) => ({ id: d.id, nome: d.nome }));
  }

  async getFrentes(cursoId: string, disciplinaId: string): Promise<Option[]> {
    const { data, error } = await this.supabase
      .from("frentes")
      .select("id, nome")
      .eq("disciplina_id", disciplinaId)
      .eq("curso_id", cursoId)
      .order("nome", { ascending: true });

    if (error) throw error;
    return (data || []).map((f) => ({ id: f.id, nome: f.nome }));
  }

  async getModulos(frenteId: string): Promise<ModuloOption[]> {
    const { data, error } = await this.supabase
      .from("modulos")
      .select("id, nome, numero_modulo")
      .eq("frente_id", frenteId)
      .order("numero_modulo", { ascending: true, nullsFirst: false });

    if (error) throw error;

    // Deduplicar
    const listaMap = new Map<string, ModuloOption>();
    (data || []).forEach((m) => {
      if (!listaMap.has(m.id)) {
        listaMap.set(m.id, {
          id: m.id,
          nome: m.nome,
          numero_modulo: m.numero_modulo,
        });
      }
    });
    return Array.from(listaMap.values());
  }

  async getAtividades(moduloId: string): Promise<Option[]> {
    const resp = await fetch(`/api/atividade?modulo_id=${moduloId}`);
    if (!resp.ok) throw new Error("Falha ao carregar atividades");
    const { data } = await resp.json();
    return (data || []).map((a: { id: string; titulo: string }) => ({
      id: a.id,
      nome: a.titulo,
    }));
  }

  async iniciarSessao(
    disciplinaId: string | null,
    frenteId: string | null,
    moduloId: string | null,
    atividadeId: string | null,
    metodo: MetodoEstudo,
  ): Promise<{ id: string; inicio: string }> {
    const {
      data: { session },
      error,
    } = await this.supabase.auth.getSession();
    if (error || !session) throw new Error("Sessão expirada");

    const body = {
      disciplina_id: disciplinaId,
      frente_id: frenteId,
      modulo_id: moduloId,
      atividade_relacionada_id: atividadeId,
      metodo_estudo: metodo,
      inicio: new Date().toISOString(),
    };

    const resp = await fetch("/api/sessao/iniciar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || "Erro ao iniciar sessão");
    }

    const { data } = await resp.json();
    return data;
  }

  async finalizarSessao(
    sessaoId: string,
    logPausas: LogPausa[],
    lastTickAt: string | null,
    nivelFoco: number,
    concluiuAtividade: boolean,
    atividadeId: string,
  ): Promise<void> {
    const {
      data: { session },
      error,
    } = await this.supabase.auth.getSession();
    if (error || !session) throw new Error("Sessão expirada");

    const resp = await fetch("/api/sessao/finalizar", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        sessao_id: sessaoId,
        log_pausas: logPausas,
        fim: lastTickAt ?? new Date().toISOString(),
        nivel_foco: nivelFoco,
        status: "concluido",
      }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || "Erro ao finalizar sessão");
    }

    if (concluiuAtividade && atividadeId) {
      try {
        await fetch(`/api/progresso-atividade/atividade/${atividadeId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ status: "Concluido" }),
        });
      } catch (err) {
        console.warn("[foco-service] Falha ao marcar atividade concluída", err);
      }
    }
  }

  async sendHeartbeat(sessaoId: string): Promise<void> {
    const {
      data: { session },
      error,
    } = await this.supabase.auth.getSession();
    if (error || !session) return;

    try {
      await fetch("/api/sessao/heartbeat", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessao_id: sessaoId }),
      });
    } catch (err) {
      console.warn("[foco-service] heartbeat falhou", err);
    }
  }
}

export const focoService = new FocoService();
