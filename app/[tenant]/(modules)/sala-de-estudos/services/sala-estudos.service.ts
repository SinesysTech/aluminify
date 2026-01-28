import { createClient } from "@/app/shared/core/client";
import {
  AtividadeComProgresso,
  CursoComDisciplinas,
  DisciplinaComFrentes,
  FrenteComModulos,
  ModuloComAtividades,
  DesempenhoData,
} from "../types";
import { StatusAtividade } from "@/app/[tenant]/(modules)/sala-de-estudos/services/atividades";

export class SalaEstudosService {
  private supabase = createClient();

  async getInitialData(
    alunoId: string,
    userRole: string,
    activeOrgId?: string,
  ): Promise<{
    atividades: AtividadeComProgresso[];
    estrutura: CursoComDisciplinas[];
    cursos: Array<{ id: string; nome: string }>;
  }> {
    const {
      data: { session },
      error: sessionError,
    } = await this.supabase.auth.getSession();
    if (sessionError || !session) throw new Error("Sessão inválida");

    // 1. Fetch Atividades based on Role
    let atividadesComProgresso: AtividadeComProgresso[] = [];
    let cursos: Array<{ id: string; nome: string }> = [];

    if (userRole !== "professor" && userRole !== "superadmin") {
      const url = new URL(
        `/api/sala-de-estudos/atividades/aluno/${alunoId}`,
        window.location.origin,
      );
      if (activeOrgId) url.searchParams.set("empresa_id", activeOrgId);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao carregar atividades");
      }

      const payload = await response.json();
      atividadesComProgresso = payload.data || [];

      // Se não houver atividades, buscar cursos para filtro
      if (atividadesComProgresso.length === 0) {
        const cursosResp = await fetch(`/api/usuario/alunos/cursos/${alunoId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cursosResp.ok) {
          const cPayload = await cursosResp.json();
          cursos = cPayload.data || [];
        }
        return { atividades: [], estrutura: [], cursos };
      }
    } else {
      // Logic for professor/superadmin (simplified from client)
      // This part was quite complex in client.tsx, re-implementing logic to fetch all...
      // Ideally this should be an API endpoint too, but for refactor we keep client-side orchestration if no API exists.
      // For brevity in this refactor, assuming the API /api/sala-de-estudos/atividades/aluno handles basic fetching.
      // But looking at client.tsx, there was a HUGE block for "Se for professor..." and manual JOINs.
      // We should encapsulate that complex logic here or better yet, assume the API handles it.
      // Given constraints, I will migrate the logic effectively.

      // Let's implement the 'else' block logic from client.tsx here ONLY if needed.
      // Since it's huge, let's keep it structurally similar to client.tsx but cleaner.

      // For now, let's delegate to the same implementation style as client.tsx
      // But to be safe, I'll copy the logic logic from client.tsx into a private method or just inline it if it's main flow.
      cursos = await this.fetchCursosForRole(userRole, alunoId, activeOrgId);
      atividadesComProgresso = await this.fetchAtividadesForCursos(
        cursos.map((c) => c.id),
        alunoId,
      );
    }

    // 2. Sort
    this.sortAtividades(atividadesComProgresso);

    // 3. Build Hierarchy
    const estrutura = this.buildHierarchy(atividadesComProgresso);

    // Extract unique courses from activities if not set
    if (cursos.length === 0) {
      const uniqueCursos = new Map<string, { id: string; nome: string }>();
      atividadesComProgresso.forEach((a) => {
        uniqueCursos.set(a.cursoId, { id: a.cursoId, nome: a.cursoNome });
      });
      cursos = Array.from(uniqueCursos.values());
    }

    return { atividades: atividadesComProgresso, estrutura, cursos };
  }

  private async fetchCursosForRole(
    role: string,
    alunoId: string,
    activeOrgId?: string,
  ) {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    if (!session) throw new Error("No session");

    if (role === "professor" || role === "superadmin") {
      const { data, error } = await this.supabase
        .from("cursos")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return data || [];
    } else {
      // Aluno fetch via alunos_cursos
      const { data, error } = await this.supabase
        .from("alunos_cursos")
        .select("cursos!inner(id, nome, empresa_id)")
        .eq("aluno_id", alunoId);

      if (error) throw error;
      let cursos = (data || []).map(
        (d: {
          cursos:
            | { id: string; nome: string; empresa_id: string }
            | { id: string; nome: string; empresa_id: string }[];
        }) => (Array.isArray(d.cursos) ? d.cursos[0] : d.cursos),
      );
      if (activeOrgId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cursos = (cursos as any[]).filter((c) => c.empresa_id === activeOrgId);
      }
      return cursos;
    }
  }

  // Complex fetch logic from client.tsx (steps 2-8) re-implemented
  private async fetchAtividadesForCursos(
    cursoIds: string[],
    alunoId: string,
  ): Promise<AtividadeComProgresso[]> {
    if (cursoIds.length === 0) return [];

    // This replicates the complex chain: cursos -> disciplinas -> frentes -> modulos -> atividades -> progresso
    // Due to complexity, this really should be a backend View or Function.
    // But for this refactor, I will keep client-side logic but inside this service using Supabase SDK.

    // ... (Implementation detail: omitting for brevity in this prompt, but in real file I will write it all)
    // Actually, I MUST write it all for it to work.

    // OK, let's assume for now the user uses the 'GetInitialData' which mostly hits the API for students.
    // For professors, I will implement the chains.

    // 2. Cursos -> Disciplinas
    const { data: cdData } = await this.supabase
      .from("cursos_disciplinas")
      .select("disciplina_id, curso_id")
      .in("curso_id", cursoIds);
    if (!cdData) return [];
    const disciplinaIds = [...new Set(cdData.map((d) => d.disciplina_id))];

    // 3. Disciplinas -> Frentes
    const { data: fData } = await this.supabase
      .from("frentes")
      .select("id, nome, disciplina_id, curso_id")
      .in("disciplina_id", disciplinaIds);
    if (!fData) return [];
    // Filter frentes by curso if needed
    const frentes = fData.filter(
      (f) => !f.curso_id || cursoIds.includes(f.curso_id),
    );
    const frenteIds = frentes.map((f) => f.id);

    // 4. Frentes -> Modulos
    const { data: mData } = await this.supabase
      .from("modulos")
      .select("id, nome, numero_modulo, frente_id")
      .in("frente_id", frenteIds)
      .order("numero_modulo", { ascending: true });
    if (!mData) return [];
    const moduloIds = [...new Set(mData.map((m) => m.id))];

    // 5. Modulos -> Atividades
    const { data: aData } = await this.supabase
      .from("atividades")
      .select("*")
      .in("modulo_id", moduloIds)
      .order("ordem_exibicao");
    if (!aData) return [];

    // 6. Progresso (Mocked or Empty for professor? Or fetch for specific student?)
    // In the original code, it fetches progresso for 'alunoId'.
    const atividadeIds = aData.map((a) => a.id);
    const { data: pData } = await this.supabase
      .from("progresso_atividades")
      .select("*")
      .eq("aluno_id", alunoId)
      .in("atividade_id", atividadeIds);
    const progressoMap = new Map((pData || []).map((p) => [p.atividade_id, p]));

    // 7. Info lookups (names)
    const { data: dInfos } = await this.supabase
      .from("disciplinas")
      .select("id, nome")
      .in("id", disciplinaIds);
    const dMap = new Map((dInfos || []).map((d) => [d.id, d]));

    const { data: cInfos } = await this.supabase
      .from("cursos")
      .select("id, nome")
      .in("id", cursoIds);
    const cMap = new Map((cInfos || []).map((c) => [c.id, c]));

    const mMap = new Map(mData.map((m) => [m.id, m]));
    const fMap = new Map(frentes.map((f) => [f.id, f]));

    // Map curso-disciplina for lookup
    const cursoDiscMap = new Map<string, string[]>();
    cdData.forEach((item) => {
      if (!cursoDiscMap.has(item.curso_id)) cursoDiscMap.set(item.curso_id, []);
      cursoDiscMap.get(item.curso_id)?.push(item.disciplina_id);
    });

    // 8. Assembly
    const result: AtividadeComProgresso[] = [];

    for (const atv of aData) {
      if (!atv.modulo_id) continue;
      const mod = mMap.get(atv.modulo_id);
      if (!mod || !mod.frente_id) continue;
      const fre = fMap.get(mod.frente_id);
      if (!fre || !fre.disciplina_id) continue;
      const disc = dMap.get(fre.disciplina_id);
      if (!disc) continue;

      // Determine Curso
      let cId = null;
      if (fre.curso_id) cId = fre.curso_id;
      else {
        // Find curso that has this disciplina
        for (const [k, v] of cursoDiscMap.entries()) {
          if (v.includes(disc.id)) {
            cId = k;
            break;
          }
        }
      }
      if (!cId) continue;
      const cur = cMap.get(cId);
      if (!cur) continue;

      const prog = progressoMap.get(atv.id);

      result.push({
        id: atv.id,
        moduloId: mod.id,
        tipo: atv.tipo,
        titulo: atv.titulo,
        arquivoUrl: atv.arquivo_url,
        gabaritoUrl: atv.gabarito_url,
        linkExterno: atv.link_externo,
        obrigatorio: atv.obrigatorio ?? false,
        ordemExibicao: atv.ordem_exibicao ?? 0,
        createdBy: atv.created_by,
        createdAt: atv.created_at || "",
        updatedAt: atv.updated_at || "",
        moduloNome: mod.nome,
        moduloNumero: mod.numero_modulo,
        frenteNome: fre.nome,
        frenteId: fre.id,
        disciplinaNome: disc.nome,
        disciplinaId: disc.id,
        cursoNome: cur.nome,
        cursoId: cur.id,
        progressoStatus: (prog?.status as StatusAtividade) || null,
        progressoDataInicio: prog?.data_inicio ?? null,
        progressoDataConclusao: prog?.data_conclusao ?? null,
        questoesTotais: prog?.questoes_totais,
        questoesAcertos: prog?.questoes_acertos,
        dificuldadePercebida: prog?.dificuldade_percebida,
        anotacoesPessoais: prog?.anotacoes_pessoais,
      });
    }

    return result;
  }

  private sortAtividades(list: AtividadeComProgresso[]) {
    list.sort((a, b) => {
      if (a.cursoNome !== b.cursoNome)
        return a.cursoNome.localeCompare(b.cursoNome);
      if (a.disciplinaNome !== b.disciplinaNome)
        return a.disciplinaNome.localeCompare(b.disciplinaNome);
      if (a.frenteNome !== b.frenteNome)
        return a.frenteNome.localeCompare(b.frenteNome);
      const mA = a.moduloNumero ?? 0;
      const mB = b.moduloNumero ?? 0;
      if (mA !== mB) return mA - mB;
      return (a.ordemExibicao ?? 0) - (b.ordemExibicao ?? 0);
    });
  }

  private buildHierarchy(list: AtividadeComProgresso[]): CursoComDisciplinas[] {
    const estrutura: CursoComDisciplinas[] = [];
    const mapC = new Map<string, CursoComDisciplinas>();
    const mapD = new Map<string, DisciplinaComFrentes>();
    const mapF = new Map<string, FrenteComModulos>();
    const mapM = new Map<string, ModuloComAtividades>();

    list.forEach((atv) => {
      // Curso
      if (!mapC.has(atv.cursoId)) {
        const c = { id: atv.cursoId, nome: atv.cursoNome, disciplinas: [] };
        mapC.set(atv.cursoId, c);
        estrutura.push(c);
      }
      const c = mapC.get(atv.cursoId)!;

      // Disciplina
      const dKey = `${atv.cursoId}-${atv.disciplinaId}`;
      if (!mapD.has(dKey)) {
        const d = {
          id: atv.disciplinaId,
          nome: atv.disciplinaNome,
          frentes: [],
        };
        mapD.set(dKey, d);
        c.disciplinas.push(d);
      }
      const d = mapD.get(dKey)!;

      // Frente
      const fKey = `${atv.disciplinaId}-${atv.frenteId}`;
      if (!mapF.has(fKey)) {
        const f = {
          id: atv.frenteId,
          nome: atv.frenteNome,
          disciplinaId: atv.disciplinaId,
          modulos: [],
        };
        mapF.set(fKey, f);
        d.frentes.push(f);
      }
      const f = mapF.get(fKey)!;

      // Modulo
      if (!mapM.has(atv.moduloId)) {
        const m = {
          id: atv.moduloId,
          nome: atv.moduloNome,
          numeroModulo: atv.moduloNumero,
          frenteId: atv.frenteId,
          atividades: [],
        };
        mapM.set(atv.moduloId, m);
        f.modulos.push(m);
      }
      const m = mapM.get(atv.moduloId)!;

      m.atividades.push(atv);
    });

    return estrutura;
  }

  async updateStatus(
    atividadeId: string,
    status: StatusAtividade,
  ): Promise<void> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    if (!session) throw new Error("Sessão inválida");

    const response = await fetch(
      `/api/sala-de-estudos/progresso/atividade/${atividadeId}`,
      {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status }),
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || "Falha ao atualizar status da atividade");
    }
  }

  async updateDesempenho(
    atividadeId: string,
    status: StatusAtividade,
    desempenho: DesempenhoData,
  ): Promise<void> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    if (!session) throw new Error("Sessão inválida");

    const response = await fetch(
      `/api/sala-de-estudos/progresso/atividade/${atividadeId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        // IMPORTANTE:
        // A API espera `desempenho` (camelCase) quando a atividade requer desempenho.
        body: JSON.stringify({
          status,
          desempenho: {
            questoesTotais: desempenho.questoesTotais,
            questoesAcertos: desempenho.questoesAcertos,
            dificuldadePercebida: desempenho.dificuldadePercebida,
            anotacoesPessoais: desempenho.anotacoesPessoais ?? null,
          },
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || "Falha ao registrar desempenho da atividade");
    }
  }
}

export const salaEstudosService = new SalaEstudosService();
