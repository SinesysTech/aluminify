import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface FeriasPeriodo {
  inicio: string;
  fim: string;
}

interface GerarCronogramaInput {
  aluno_id: string;
  data_inicio: string;
  data_fim: string;
  ferias: FeriasPeriodo[];
  horas_dia: number;
  dias_semana: number;
  prioridade_minima: number;
  disciplinas_ids: string[];
  modalidade: "paralelo" | "sequencial";
  curso_alvo_id?: string;
  nome?: string;
  ordem_frentes_preferencia?: string[];
  modulos_ids?: string[];
  excluir_aulas_concluidas?: boolean;
  velocidade_reproducao?: number;
}

interface AulaCompleta {
  id: string;
  nome: string;
  numero_aula: number | null;
  tempo_estimado_minutos: number | null;
  prioridade: number | null;
  modulo_id: string;
  modulo_nome: string;
  numero_modulo: number | null;
  frente_id: string;
  frente_nome: string;
  disciplina_id: string;
  disciplina_nome: string;
}

interface SemanaInfo {
  numero: number;
  data_inicio: Date;
  data_fim: Date;
  is_ferias: boolean;
  capacidade_minutos: number;
}

function validarViabilidadeSemanal(
  modalidade: "paralelo" | "sequencial",
  aulasComCusto: Array<AulaCompleta & { custo: number }>,
  capacidadeSemanalMin: number,
): { ok: true } | { ok: false; error: string; detalhes: Record<string, unknown> } {
  if (!Number.isFinite(capacidadeSemanalMin) || capacidadeSemanalMin <= 0) {
    return {
      ok: false,
      error: "Capacidade semanal inválida",
      detalhes: { capacidade_semanal_minutos: capacidadeSemanalMin },
    };
  }

  if (modalidade === "paralelo") {
    const minPorFrente = new Map<string, number>();
    aulasComCusto.forEach((a) => {
      const prev = minPorFrente.get(a.frente_id);
      if (prev === undefined || a.custo < prev) minPorFrente.set(a.frente_id, a.custo);
    });
    const minimo = Array.from(minPorFrente.values()).reduce((acc, v) => acc + v, 0);
    if (minimo > capacidadeSemanalMin) {
      return {
        ok: false,
        error: "Tempo insuficiente para garantir todas as frentes em todas as semanas",
        detalhes: {
          minimo_semanal_necessario_minutos: Math.ceil(minimo),
          capacidade_semanal_minutos: Math.floor(capacidadeSemanalMin),
          total_frentes: minPorFrente.size,
          regra: "paralelo: 1 item por frente por semana",
        },
      };
    }
    return { ok: true };
  }

  const minPorDisciplina = new Map<string, number>();
  aulasComCusto.forEach((a) => {
    const prev = minPorDisciplina.get(a.disciplina_id);
    if (prev === undefined || a.custo < prev) minPorDisciplina.set(a.disciplina_id, a.custo);
  });
  const minimo = Array.from(minPorDisciplina.values()).reduce((acc, v) => acc + v, 0);
  if (minimo > capacidadeSemanalMin) {
    return {
      ok: false,
      error: "Tempo insuficiente para garantir todas as disciplinas em todas as semanas",
      detalhes: {
        minimo_semanal_necessario_minutos: Math.ceil(minimo),
        capacidade_semanal_minutos: Math.floor(capacidadeSemanalMin),
        total_disciplinas: minPorDisciplina.size,
        regra: "sequencial: 1 item por disciplina por semana",
      },
    };
  }
  return { ok: true };
}

function pickReviewAula(
  pool: Array<AulaCompleta & { custo: number }>,
  startIndex: number,
  remaining: number,
): { aula: AulaCompleta & { custo: number }; nextIndex: number } | null {
  if (!pool.length) return null;

  // rotação a partir do índice atual
  for (let i = 0; i < pool.length; i++) {
    const idx = (startIndex + i) % pool.length;
    const cand = pool[idx];
    if (cand.custo <= remaining) {
      return { aula: cand, nextIndex: (idx + 1) % pool.length };
    }
  }

  // fallback: menor que cabe
  const cheapest = [...pool].sort((a, b) => a.custo - b.custo).find((a) => a.custo <= remaining);
  if (!cheapest) return null;
  return { aula: cheapest, nextIndex: startIndex };
}

function distribuirParaleloPorFrente(
  aulasComCusto: Array<AulaCompleta & { custo: number }>,
  semanasUteis: SemanaInfo[],
): Array<{ cronograma_id: string; aula_id: string; semana_numero: number; ordem_na_semana: number }> {
  const N = semanasUteis.length;
  const REVIEW_POOL_SIZE = 5;

  type FrenteState = {
    frente_id: string;
    frente_nome: string;
    disciplina_nome: string;
    aulas: Array<AulaCompleta & { custo: number }>;
    idx: number;
    totalCusto: number;
    quota: number;
    credit: number;
    reviewPool: Array<AulaCompleta & { custo: number }>;
    reviewIdx: number;
  };

  const byFrente = new Map<string, FrenteState>();
  for (const a of aulasComCusto) {
    if (!byFrente.has(a.frente_id)) {
      byFrente.set(a.frente_id, {
        frente_id: a.frente_id,
        frente_nome: a.frente_nome,
        disciplina_nome: a.disciplina_nome,
        aulas: [],
        idx: 0,
        totalCusto: 0,
        quota: 0,
        credit: 0,
        reviewPool: [],
        reviewIdx: 0,
      });
    }
    const st = byFrente.get(a.frente_id)!;
    st.aulas.push(a);
    st.totalCusto += a.custo;
  }

  const frentes = Array.from(byFrente.values()).sort((a, b) => {
    const d = a.disciplina_nome.localeCompare(b.disciplina_nome);
    if (d !== 0) return d;
    return a.frente_nome.localeCompare(b.frente_nome);
  });

  frentes.forEach((f) => {
    f.quota = f.totalCusto / N;
    f.reviewPool = f.aulas.slice(-Math.min(REVIEW_POOL_SIZE, f.aulas.length));
    f.reviewIdx = 0;
  });

  const itens: Array<{ cronograma_id: string; aula_id: string; semana_numero: number; ordem_na_semana: number }> = [];

  for (const semana of semanasUteis) {
    let remaining = semana.capacidade_minutos;
    let ordemNaSemana = 1;

    frentes.forEach((f) => {
      f.credit += f.quota;
    });

    // garantia: 1 por frente/semana
    for (const f of frentes) {
      const nextAula = f.idx < f.aulas.length ? f.aulas[f.idx] : null;
      let chosen: AulaCompleta & { custo: number } | null = null;
      let isTeaching = false;

      if (nextAula && nextAula.custo <= remaining) {
        chosen = nextAula;
        isTeaching = true;
      } else {
        const reviewPick = pickReviewAula(f.reviewPool, f.reviewIdx, remaining);
        if (reviewPick) {
          chosen = reviewPick.aula;
          f.reviewIdx = reviewPick.nextIndex;
        }
      }

      if (!chosen) {
        throw new Error(`Falha ao garantir presença semanal da frente ${f.frente_nome}`);
      }

      itens.push({
        cronograma_id: "",
        aula_id: chosen.id,
        semana_numero: semana.numero,
        ordem_na_semana: ordemNaSemana++,
      });
      remaining -= chosen.custo;
      f.credit -= chosen.custo;
      if (isTeaching) f.idx++;
    }

    // preenchimento por crédito
    let progressed = true;
    while (progressed && remaining > 0) {
      progressed = false;
      for (const f of frentes) {
        const nextAula = f.idx < f.aulas.length ? f.aulas[f.idx] : null;
        if (!nextAula) continue;
        if (nextAula.custo > remaining) continue;
        if (f.credit < nextAula.custo) continue;

        itens.push({
          cronograma_id: "",
          aula_id: nextAula.id,
          semana_numero: semana.numero,
          ordem_na_semana: ordemNaSemana++,
        });
        remaining -= nextAula.custo;
        f.credit -= nextAula.custo;
        f.idx++;
        progressed = true;
        if (remaining <= 0) break;
      }
    }
  }

  return itens;
}

function distribuirSequencialPorDisciplina(
  aulasComCusto: Array<AulaCompleta & { custo: number }>,
  semanasUteis: SemanaInfo[],
  ordemFrentesPreferencia?: string[],
): Array<{ cronograma_id: string; aula_id: string; semana_numero: number; ordem_na_semana: number }> {
  const N = semanasUteis.length;
  const REVIEW_POOL_SIZE = 5;

  type FrenteState = {
    frente_id: string;
    frente_nome: string;
    aulas: Array<AulaCompleta & { custo: number }>;
    idx: number;
    reviewPool: Array<AulaCompleta & { custo: number }>;
    reviewIdx: number;
  };

  type DiscState = {
    disciplina_id: string;
    disciplina_nome: string;
    frentes: FrenteState[];
    currentFrontIdx: number;
    totalCusto: number;
    quota: number;
    credit: number;
    reviewPool: Array<AulaCompleta & { custo: number }>;
    reviewIdx: number;
  };

  const byDisc = new Map<string, DiscState>();
  for (const a of aulasComCusto) {
    if (!byDisc.has(a.disciplina_id)) {
      byDisc.set(a.disciplina_id, {
        disciplina_id: a.disciplina_id,
        disciplina_nome: a.disciplina_nome,
        frentes: [],
        currentFrontIdx: 0,
        totalCusto: 0,
        quota: 0,
        credit: 0,
        reviewPool: [],
        reviewIdx: 0,
      });
    }
    const d = byDisc.get(a.disciplina_id)!;
    d.totalCusto += a.custo;

    let f = d.frentes.find((x) => x.frente_id === a.frente_id);
    if (!f) {
      f = { frente_id: a.frente_id, frente_nome: a.frente_nome, aulas: [], idx: 0, reviewPool: [], reviewIdx: 0 };
      d.frentes.push(f);
    }
    f.aulas.push(a);
  }

  const disciplinas = Array.from(byDisc.values()).sort((a, b) => a.disciplina_nome.localeCompare(b.disciplina_nome));

  disciplinas.forEach((d) => {
    if (ordemFrentesPreferencia?.length) {
      const ordemMap = new Map(ordemFrentesPreferencia.map((nome, idx) => [nome, idx]));
      d.frentes.sort((a, b) => (ordemMap.get(a.frente_nome) ?? Infinity) - (ordemMap.get(b.frente_nome) ?? Infinity));
    } else {
      d.frentes.sort((a, b) => a.frente_nome.localeCompare(b.frente_nome));
    }

    d.frentes.forEach((f) => {
      f.reviewPool = f.aulas.slice(-Math.min(REVIEW_POOL_SIZE, f.aulas.length));
      f.reviewIdx = 0;
    });

    const allAulas = d.frentes.flatMap((f) => f.aulas);
    d.reviewPool = allAulas.slice(-Math.min(REVIEW_POOL_SIZE, allAulas.length));
    d.reviewIdx = 0;
    d.quota = d.totalCusto / N;
  });

  const itens: Array<{ cronograma_id: string; aula_id: string; semana_numero: number; ordem_na_semana: number }> = [];

  for (const semana of semanasUteis) {
    let remaining = semana.capacidade_minutos;
    let ordemNaSemana = 1;

    disciplinas.forEach((d) => { d.credit += d.quota; });

    // garantia: 1 item por disciplina/semana
    for (const d of disciplinas) {
      while (
        d.currentFrontIdx < d.frentes.length &&
        d.frentes[d.currentFrontIdx].idx >= d.frentes[d.currentFrontIdx].aulas.length
      ) {
        d.currentFrontIdx++;
      }

      const currentFront = d.currentFrontIdx < d.frentes.length ? d.frentes[d.currentFrontIdx] : null;
      const nextAula = currentFront && currentFront.idx < currentFront.aulas.length ? currentFront.aulas[currentFront.idx] : null;

      let chosen: AulaCompleta & { custo: number } | null = null;
      let isTeaching = false;

      if (nextAula && nextAula.custo <= remaining) {
        chosen = nextAula;
        isTeaching = true;
      } else if (currentFront) {
        const reviewPick = pickReviewAula(currentFront.reviewPool, currentFront.reviewIdx, remaining);
        if (reviewPick) {
          chosen = reviewPick.aula;
          currentFront.reviewIdx = reviewPick.nextIndex;
        }
      } else {
        const reviewPick = pickReviewAula(d.reviewPool, d.reviewIdx, remaining);
        if (reviewPick) {
          chosen = reviewPick.aula;
          d.reviewIdx = reviewPick.nextIndex;
        }
      }

      if (!chosen) {
        throw new Error(`Falha ao garantir presença semanal da disciplina ${d.disciplina_nome}`);
      }

      itens.push({
        cronograma_id: "",
        aula_id: chosen.id,
        semana_numero: semana.numero,
        ordem_na_semana: ordemNaSemana++,
      });
      remaining -= chosen.custo;
      d.credit -= chosen.custo;
      if (isTeaching && currentFront) currentFront.idx++;
    }

    // preenchimento por crédito (sem trocar de frente na mesma semana)
    let progressed = true;
    while (progressed && remaining > 0) {
      progressed = false;
      for (const d of disciplinas) {
        if (d.currentFrontIdx >= d.frentes.length) continue;
        const currentFront = d.frentes[d.currentFrontIdx];
        const nextAula = currentFront.idx < currentFront.aulas.length ? currentFront.aulas[currentFront.idx] : null;
        if (!nextAula) continue;
        if (nextAula.custo > remaining) continue;
        if (d.credit < nextAula.custo) continue;

        itens.push({
          cronograma_id: "",
          aula_id: nextAula.id,
          semana_numero: semana.numero,
          ordem_na_semana: ordemNaSemana++,
        });
        remaining -= nextAula.custo;
        d.credit -= nextAula.custo;
        currentFront.idx++;
        progressed = true;
        if (remaining <= 0) break;
      }
    }
  }

  return itens;
}

async function buscarAulasConcluidas(
  supabaseAdmin: ReturnType<typeof createClient>,
  alunoId: string,
  cursoId?: string,
): Promise<Set<string>> {
  if (!cursoId) {
    return new Set();
  }

  const { data, error } = await supabaseAdmin
    .from('aulas_concluidas')
    .select('aula_id')
    .eq('aluno_id', alunoId)
    .eq('curso_id', cursoId);

  if (error) {
    console.error('Erro ao buscar aulas concluidas:', error);
  } else if (data && data.length > 0) {
    return new Set(data.map((row) => row.aula_id as string));
  }

  const { data: historicoData, error: historicoError } = await supabaseAdmin
    .from('cronograma_itens')
    .select('aula_id, cronogramas!inner(aluno_id, curso_alvo_id)')
    .eq('concluido', true)
    .eq('cronogramas.aluno_id', alunoId)
    .eq('cronogramas.curso_alvo_id', cursoId);

  if (historicoError) {
    console.error('Erro ao buscar histórico de aulas concluidas:', historicoError);
    return new Set();
  }

  return new Set((historicoData ?? []).map((row) => row.aula_id as string));
}

// Headers CORS para todas as respostas
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  console.log("=== INÍCIO DA REQUISIÇÃO ===");
  console.log("Método:", req.method);
  console.log("URL:", req.url);
  
  try {
    // CORS headers
    if (req.method === "OPTIONS") {
      console.log("Resposta OPTIONS");
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }
    
    console.log("Processando requisição POST");

    // Validar método
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método não permitido. Use POST." }),
        {
          status: 405,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    console.log("Variáveis de ambiente:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl.length,
      serviceKeyLength: supabaseServiceKey.length,
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variáveis de ambiente não configuradas", {
        supabaseUrl: supabaseUrl ? "OK" : "MISSING",
        supabaseServiceKey: supabaseServiceKey ? "OK" : "MISSING",
      });
      return new Response(
        JSON.stringify({ error: "Configuração do servidor inválida" }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    // Obter token de autenticação do header
    // Com as novas chaves publishable/secret, verify_jwt está desabilitado
    // Precisamos validar manualmente o JWT do usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação não fornecido" }),
        {
          status: 401,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    authHeader.replace("Bearer ", "");
    
    // Criar cliente Supabase com ANON_KEY e SERVICE_ROLE_KEY
    // Essas variáveis ainda estão disponíveis nas Edge Functions
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    if (!supabaseAnonKey) {
      console.error("SUPABASE_ANON_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor inválida" }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    // Criar cliente com contexto de autenticação do usuário (para RLS)
    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Criar cliente com service role para operações administrativas (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validar manualmente o JWT do usuário
    // Com as novas chaves publishable/secret, verify_jwt pode não funcionar
    // Precisamos validar manualmente o token JWT do usuário
    console.log("Iniciando validação do JWT...");
    let userId: string;
    try {
      console.log("Chamando supabase.auth.getUser()...");
      // getUser() sem parâmetros usa o token do header Authorization
      // que foi passado no createClient acima
      const {
        data: { user: userData },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("Resposta do getUser():", {
        hasUser: !!userData,
        hasError: !!authError,
        errorMessage: authError?.message,
        userId: userData?.id,
      });

      if (authError || !userData) {
        console.error("Erro ao validar token:", {
          error: authError,
          errorMessage: authError?.message,
          errorCode: authError?.status,
        });
        return new Response(
          JSON.stringify({ 
            error: "Token inválido ou expirado: " + (authError?.message || "Usuário não encontrado") 
          }),
          {
            status: 401,
            headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
          }
        );
      }

      userId = userData.id;
      console.log("Usuário autenticado com sucesso:", userId);
    } catch (authErr: unknown) {
      const error = authErr as { constructor?: { name?: string }; message?: string; stack?: string };
      console.error("=== ERRO NA VALIDAÇÃO DE AUTENTICAÇÃO ===");
      console.error("Tipo:", error?.constructor?.name);
      console.error("Mensagem:", error?.message);
      console.error("Stack:", error?.stack);
      console.error("Erro completo:", JSON.stringify(authErr, Object.getOwnPropertyNames(authErr as Record<string, unknown>)));
      
      return new Response(
        JSON.stringify({ 
          error: "Erro ao validar autenticação: " + (authErr?.message || "Desconhecido"),
          tipo: authErr?.constructor?.name || "Unknown",
        }),
        {
          status: 401,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    // Parse do body
    console.log("Fazendo parse do body...");
    let input: GerarCronogramaInput;
    try {
      input = await req.json();
      console.log("Body parseado com sucesso. Campos recebidos:", {
        hasAlunoId: !!input.aluno_id,
        hasDataInicio: !!input.data_inicio,
        hasDataFim: !!input.data_fim,
        disciplinasCount: input.disciplinas_ids?.length || 0,
        modalidade: input.modalidade,
      });
    } catch (parseError: unknown) {
      const error = parseError as { constructor?: { name?: string }; message?: string; stack?: string };
      console.error("=== ERRO AO FAZER PARSE DO BODY ===");
      console.error("Tipo:", error?.constructor?.name);
      console.error("Mensagem:", error?.message);
      console.error("Stack:", error?.stack);
      
      return new Response(
        JSON.stringify({ error: "Erro ao processar dados da requisição: " + (parseError.message || "Formato inválido") }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    // Validações básicas
    if (!input.aluno_id || !input.data_inicio || !input.data_fim) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: aluno_id, data_inicio, data_fim" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    // Verificar se aluno_id corresponde ao usuário autenticado
    if (input.aluno_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Você só pode criar cronogramas para si mesmo" }),
        {
          status: 403,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    // Validar datas
    const dataInicio = new Date(input.data_inicio);
    const dataFim = new Date(input.data_fim);

    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
      return new Response(
        JSON.stringify({ error: "Datas inválidas" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    if (dataFim <= dataInicio) {
      return new Response(
        JSON.stringify({ error: "data_fim deve ser posterior a data_inicio" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    const prioridadeMinimaEfetiva = Math.max(1, input.prioridade_minima ?? 1);
    const cursoId = input.curso_alvo_id || null;
    const modulosSelecionados = Array.isArray(input.modulos_ids) ? input.modulos_ids : [];

    // ============================================
    // ETAPA 1: Cálculo de Capacidade
    // ============================================

    const semanas: SemanaInfo[] = [];
    const inicio = new Date(dataInicio);
    let semanaNumero = 1;

    while (inicio <= dataFim) {
      const fimSemana = new Date(inicio);
      fimSemana.setDate(fimSemana.getDate() + 6); // 7 dias (0-6)

      // Verificar se a semana cai em período de férias
      let isFerias = false;
      for (const periodo of input.ferias || []) {
        const inicioFerias = new Date(periodo.inicio);
        const fimFerias = new Date(periodo.fim);
        if (
          (inicio >= inicioFerias && inicio <= fimFerias) ||
          (fimSemana >= inicioFerias && fimSemana <= fimFerias) ||
          (inicio <= inicioFerias && fimSemana >= fimFerias)
        ) {
          isFerias = true;
          break;
        }
      }

      semanas.push({
        numero: semanaNumero,
        data_inicio: new Date(inicio),
        data_fim: fimSemana > dataFim ? new Date(dataFim) : fimSemana,
        is_ferias: isFerias,
        capacidade_minutos: isFerias
          ? 0
          : input.horas_dia * input.dias_semana * 60,
      });

      inicio.setDate(inicio.getDate() + 7);
      semanaNumero++;
    }

    const capacidadeTotal = semanas
      .filter((s) => !s.is_ferias)
      .reduce((acc, s) => acc + s.capacidade_minutos, 0);

    const excluirConcluidas = input.excluir_aulas_concluidas !== false;
    const aulasConcluidas = excluirConcluidas
      ? await buscarAulasConcluidas(supabaseAdmin, userId, input.curso_alvo_id)
      : new Set<string>();

    // ============================================
    // ETAPA 2: Busca e Filtragem de Aulas
    // ============================================

    // Buscar frentes das disciplinas selecionadas
    // Usar supabaseAdmin para bypass RLS (já validamos o usuário acima)
    let frentesQuery = supabaseAdmin
      .from("frentes")
      .select("id")
      .in("disciplina_id", input.disciplinas_ids);

    if (cursoId) {
      frentesQuery = frentesQuery.eq("curso_id", cursoId);
    }

    const { data: frentesData, error: frentesError } = await frentesQuery;

    if (frentesError) {
      console.error("Erro ao buscar frentes:", frentesError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar frentes: " + frentesError.message }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    const frenteIds = frentesData?.map((f) => f.id) || [];

    if (frenteIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma frente encontrada para as disciplinas selecionadas" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    // Buscar módulos das frentes
    let modulosQuery = supabaseAdmin
      .from("modulos")
      .select("id")
      .in("frente_id", frenteIds);

    if (cursoId) {
      modulosQuery = modulosQuery.eq("curso_id", cursoId);
    }

    const { data: modulosData, error: modulosError } = await modulosQuery;

    if (modulosError) {
      console.error("Erro ao buscar módulos:", modulosError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar módulos: " + modulosError.message }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    let moduloIds = modulosData?.map((m) => m.id) || [];

    if (modulosSelecionados.length > 0) {
      moduloIds = moduloIds.filter((id) => modulosSelecionados.includes(id));
    }

    if (moduloIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum módulo encontrado para as frentes selecionadas" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    // Buscar aulas dos módulos com filtro de prioridade
    let aulasQuery = supabaseAdmin
      .from("aulas")
      .select(
        `
        id,
        nome,
        numero_aula,
        tempo_estimado_minutos,
        prioridade,
        modulos!inner(
          id,
          nome,
          numero_modulo,
          frentes!inner(
            id,
            nome,
            disciplinas!inner(
              id,
              nome
            )
          )
        )
      `
      )
      .in("modulo_id", moduloIds)
      .gte("prioridade", prioridadeMinimaEfetiva)
      .neq("prioridade", 0);

    if (cursoId) {
      aulasQuery = aulasQuery.eq("curso_id", cursoId);
    }

    const { data: aulasData, error: aulasError } = await aulasQuery;

    if (aulasError) {
      console.error("Erro ao buscar aulas:", aulasError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar aulas: " + aulasError.message }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    if (!aulasData || aulasData.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma aula encontrada com os critérios fornecidos" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    // Mapear dados para estrutura mais simples
    interface AulaRow {
      id: string;
      nome: string;
      numero_aula: number | null;
      tempo_estimado_minutos: number | null;
      prioridade: number | null;
      modulos: {
        id: string;
        nome: string;
        numero_modulo: number | null;
        frentes: {
          id: string;
          nome: string;
          disciplinas: {
            id: string;
            nome: string;
          };
        };
      };
    }
    let aulas: AulaCompleta[] = aulasData.map((aula: AulaRow) => ({
      id: aula.id,
      nome: aula.nome,
      numero_aula: aula.numero_aula,
      tempo_estimado_minutos: aula.tempo_estimado_minutos,
      prioridade: aula.prioridade ?? 0,
      modulo_id: aula.modulos.id,
      modulo_nome: aula.modulos.nome,
      numero_modulo: aula.modulos.numero_modulo,
      frente_id: aula.modulos.frentes.id,
      frente_nome: aula.modulos.frentes.nome,
      disciplina_id: aula.modulos.frentes.disciplinas.id,
      disciplina_nome: aula.modulos.frentes.disciplinas.nome,
    }));

    if (excluirConcluidas && aulasConcluidas.size > 0) {
      aulas = aulas.filter((aula) => !aulasConcluidas.has(aula.id));

      if (aulas.length === 0) {
        return new Response(
          JSON.stringify({ error: "Nenhuma aula restante após excluir concluídas" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              ...corsHeaders,
            },
          },
        );
      }
    }

    // Ordenar aulas: Disciplina > Frente > Numero Modulo > Numero Aula
    aulas.sort((a, b) => {
      // Ordenar por disciplina
      if (a.disciplina_nome !== b.disciplina_nome) {
        return a.disciplina_nome.localeCompare(b.disciplina_nome);
      }
      // Ordenar por frente
      if (a.frente_nome !== b.frente_nome) {
        return a.frente_nome.localeCompare(b.frente_nome);
      }
      // Ordenar por número do módulo
      const numModA = a.numero_modulo ?? 0;
      const numModB = b.numero_modulo ?? 0;
      if (numModA !== numModB) {
        return numModA - numModB;
      }
      // Ordenar por número da aula
      const numAulaA = a.numero_aula ?? 0;
      const numAulaB = b.numero_aula ?? 0;
      return numAulaA - numAulaB;
    });

    // ============================================
    // ETAPA 3: Cálculo de Custo Real
    // ============================================

    const TEMPO_PADRAO_MINUTOS = 10;
    const FATOR_MULTIPLICADOR = 1.5;
    const velocidadeReproducao = input.velocidade_reproducao ?? 1.0;

    const aulasComCusto = aulas.map((aula) => ({
      ...aula,
      custo:
        ((aula.tempo_estimado_minutos ?? TEMPO_PADRAO_MINUTOS) /
          velocidadeReproducao) *
        FATOR_MULTIPLICADOR,
    }));

    const custoTotalNecessario = aulasComCusto.reduce(
      (acc, aula) => acc + aula.custo,
      0
    );

    // ============================================
    // ETAPA 4: Verificação de Viabilidade
    // ============================================

    if (custoTotalNecessario > capacidadeTotal) {
      const horasNecessarias = custoTotalNecessario / 60;
      const horasDisponiveis = capacidadeTotal / 60;
      const semanasUteis = semanas.filter((s) => !s.is_ferias).length;
      const horasDiaNecessarias = horasNecessarias / (semanasUteis * input.dias_semana);

      return new Response(
        JSON.stringify({
          error: "Tempo insuficiente",
          detalhes: {
            horas_necessarias: Math.ceil(horasNecessarias),
            horas_disponiveis: Math.ceil(horasDisponiveis),
            horas_dia_necessarias: Math.ceil(horasDiaNecessarias * 10) / 10,
            horas_dia_atual: input.horas_dia,
          },
        }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    // ============================================
    // ETAPA 4.1: Viabilidade semanal (presença obrigatória)
    // ============================================
    const semanasUteis = semanas.filter((s) => !s.is_ferias);
    if (semanasUteis.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma semana útil disponível no período informado" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders },
        },
      );
    }

    const capacidadeSemanalMin = Math.min(...semanasUteis.map((s) => s.capacidade_minutos));
    const semanalCheck = validarViabilidadeSemanal(input.modalidade, aulasComCusto, capacidadeSemanalMin);
    if (!semanalCheck.ok) {
      return new Response(
        JSON.stringify({ error: semanalCheck.error, detalhes: semanalCheck.detalhes }),
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders },
        },
      );
    }

    // ============================================
    // ETAPA 5: Algoritmo de Distribuição
    // ============================================

    // Distribuir por semana com as novas regras
    const itens =
      input.modalidade === "paralelo"
        ? distribuirParaleloPorFrente(aulasComCusto, semanasUteis)
        : distribuirSequencialPorDisciplina(
            aulasComCusto,
            semanasUteis,
            input.ordem_frentes_preferencia,
          );

    // ============================================
    // ETAPA 6: Persistência
    // ============================================

    // Criar registro do cronograma
    console.log("Criando registro do cronograma com dados:", {
      aluno_id: input.aluno_id,
      nome: input.nome,
      data_inicio: input.data_inicio,
      data_fim: input.data_fim,
      curso_alvo_id: input.curso_alvo_id,
    });
    
    const { data: cronograma, error: cronogramaError } = await supabaseAdmin
      .from("cronogramas")
      .insert({
        aluno_id: input.aluno_id,
        curso_alvo_id: input.curso_alvo_id || null,
        nome: input.nome || "Meu Cronograma",
        data_inicio: input.data_inicio,
        data_fim: input.data_fim,
        dias_estudo_semana: input.dias_semana,
        horas_estudo_dia: input.horas_dia,
        periodos_ferias: input.ferias || [],
        prioridade_minima: prioridadeMinimaEfetiva,
        modalidade_estudo: input.modalidade,
        disciplinas_selecionadas: input.disciplinas_ids,
        ordem_frentes_preferencia: input.ordem_frentes_preferencia || null,
        modulos_selecionados: modulosSelecionados.length ? modulosSelecionados : null,
        excluir_aulas_concluidas: excluirConcluidas,
        velocidade_reproducao: input.velocidade_reproducao ?? 1.0,
      })
      .select()
      .single();

    if (cronogramaError || !cronograma) {
      console.error("=== ERRO AO CRIAR CRONOGRAMA ===");
      console.error("Erro completo:", JSON.stringify(cronogramaError, null, 2));
      console.error("Código:", cronogramaError?.code);
      console.error("Mensagem:", cronogramaError?.message);
      console.error("Detalhes:", cronogramaError?.details);
      console.error("Hint:", cronogramaError?.hint);
      
      // Se for erro 409 (Conflict), retornar status 409
      const statusCode = cronogramaError?.code === '23505' || cronogramaError?.code === 'PGRST116' ? 409 : 500;
      
      return new Response(
        JSON.stringify({
          error: "Erro ao criar cronograma: " + (cronogramaError?.message || "Desconhecido"),
          detalhes: cronogramaError?.details || null,
          hint: cronogramaError?.hint || null,
          codigo: cronogramaError?.code || null,
        }),
        {
          status: statusCode,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }
    
    console.log("Cronograma criado com sucesso:", cronograma.id);

    // Preencher cronograma_id nos itens
    const itensCompleto = itens.map((item) => ({
      ...item,
      cronograma_id: cronograma.id,
    }));

    // Bulk insert dos itens
    const { error: itensError } = await supabaseAdmin
      .from("cronograma_itens")
      .insert(itensCompleto);

    if (itensError) {
      console.error("Erro ao inserir itens:", itensError);
      // Tentar deletar o cronograma criado
      await supabaseAdmin.from("cronogramas").delete().eq("id", cronograma.id);
      return new Response(
        JSON.stringify({
          error: "Erro ao inserir itens do cronograma: " + itensError.message,
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    // Buscar cronograma completo com itens
    const { data: cronogramaCompleto, error: fetchError } = await supabaseAdmin
      .from("cronogramas")
      .select(
        `
        *,
        cronograma_itens(
          id,
          aula_id,
          semana_numero,
          ordem_na_semana,
          concluido,
          aulas(
            id,
            nome,
            numero_aula,
            tempo_estimado_minutos
          )
        )
      `
      )
      .eq("id", cronograma.id)
      .single();

    if (fetchError) {
      console.error("Erro ao buscar cronograma completo:", fetchError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cronograma: cronogramaCompleto || cronograma,
        estatisticas: {
          total_aulas: aulas.length,
          total_semanas: semanas.length,
          semanas_uteis: semanasUteis.length,
          capacidade_total_minutos: capacidadeTotal,
          custo_total_minutos: custoTotalNecessario,
          frentes_distribuidas: frentes.length,
        },
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("=== ERRO INESPERADO ===");
    console.error("Tipo do erro:", error?.constructor?.name);
    console.error("Mensagem:", error instanceof Error ? error.message : String(error));
    console.error("Stack:", error instanceof Error ? error.stack : "N/A");
    console.error("Erro completo:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor",
        detalhes: error instanceof Error ? error.message : String(error),
        tipo: error?.constructor?.name || "Unknown",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...corsHeaders,
        },
      }
    );
  }
});

