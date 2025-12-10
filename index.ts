// @ts-nocheck - Este arquivo é uma Edge Function do Deno e deve ser processado pelo Deno Language Server
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

async function buscarAulasConcluidas(
  supabaseAdmin: ReturnType<typeof createClient>,
  alunoId: string,
  cursoId?: string,
): Promise<Set<string>> {
  if (!cursoId) {
    return new Set();
  }

  const { data, error } = await supabaseAdmin
    .from("aulas_concluidas")
    .select("aula_id")
    .eq("aluno_id", alunoId)
    .eq("curso_id", cursoId);

  if (error) {
    console.error("Erro ao buscar aulas concluidas:", error);
  } else if (data && data.length > 0) {
    return new Set(data.map((row) => row.aula_id as string));
  }

  const { data: historicoData, error: historicoError } = await supabaseAdmin
    .from("cronograma_itens")
    .select("aula_id, cronogramas!inner(aluno_id, curso_alvo_id)")
    .eq("concluido", true)
    .eq("cronogramas.aluno_id", alunoId)
    .eq("cronogramas.curso_alvo_id", cursoId);

  if (historicoError) {
    console.error("Erro ao buscar histórico de aulas concluidas:", historicoError);
    return new Set();
  }

  return new Set((historicoData ?? []).map((row) => row.aula_id as string));
}
Deno.serve(async (req)=>{
  console.log("=== INÍCIO DA REQUISIÇÃO ===");
  console.log("Método:", req.method);
  console.log("URL:", req.url);
  try {
    // CORS headers
    if (req.method === "OPTIONS") {
      console.log("Resposta OPTIONS");
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
        }
      });
    }
    console.log("Processando requisição POST");
    // Validar método
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Método não permitido. Use POST."
      }), {
        status: 405,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    console.log("Variáveis de ambiente:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl.length,
      serviceKeyLength: supabaseServiceKey.length
    });
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variáveis de ambiente não configuradas", {
        supabaseUrl: supabaseUrl ? "OK" : "MISSING",
        supabaseServiceKey: supabaseServiceKey ? "OK" : "MISSING"
      });
      return new Response(JSON.stringify({
        error: "Configuração do servidor inválida"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Obter token de autenticação do header
    // Com as novas chaves publishable/secret, verify_jwt está desabilitado
    // Precisamos validar manualmente o JWT do usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: "Token de autenticação não fornecido"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Criar cliente Supabase com ANON_KEY e SERVICE_ROLE_KEY
    // Essas variáveis ainda estão disponíveis nas Edge Functions
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseAnonKey) {
      console.error("SUPABASE_ANON_KEY não configurada");
      return new Response(JSON.stringify({
        error: "Configuração do servidor inválida"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Criar cliente com contexto de autenticação do usuário (para RLS)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    // Criar cliente com service role para operações administrativas (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    // Validar manualmente o JWT do usuário
    // Com as novas chaves publishable/secret, verify_jwt pode não funcionar
    // Precisamos validar manualmente o token JWT do usuário
    console.log("Iniciando validação do JWT...");
    let userId;
    try {
      console.log("Chamando supabase.auth.getUser()...");
      // getUser() sem parâmetros usa o token do header Authorization
      // que foi passado no createClient acima
      const { data: { user: userData }, error: authError } = await supabase.auth.getUser();
      console.log("Resposta do getUser():", {
        hasUser: !!userData,
        hasError: !!authError,
        errorMessage: authError?.message,
        userId: userData?.id
      });
      if (authError || !userData) {
        console.error("Erro ao validar token:", {
          error: authError,
          errorMessage: authError?.message,
          errorCode: authError?.status
        });
        return new Response(JSON.stringify({
          error: "Token inválido ou expirado: " + (authError?.message || "Usuário não encontrado")
        }), {
          status: 401,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }
      userId = userData.id;
      console.log("Usuário autenticado com sucesso:", userId);
    } catch (authErr) {
      console.error("=== ERRO NA VALIDAÇÃO DE AUTENTICAÇÃO ===");
      console.error("Tipo:", authErr?.constructor?.name);
      console.error("Mensagem:", authErr?.message);
      console.error("Stack:", authErr?.stack);
      console.error("Erro completo:", JSON.stringify(authErr, Object.getOwnPropertyNames(authErr)));
      return new Response(JSON.stringify({
        error: "Erro ao validar autenticação: " + (authErr?.message || "Desconhecido"),
        tipo: authErr?.constructor?.name || "Unknown"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Parse do body
    console.log("Fazendo parse do body...");
    let input;
    try {
      input = await req.json();
      console.log("Body parseado com sucesso. Campos recebidos:", {
        hasAlunoId: !!input.aluno_id,
        hasDataInicio: !!input.data_inicio,
        hasDataFim: !!input.data_fim,
        disciplinasCount: input.disciplinas_ids?.length || 0,
        modalidade: input.modalidade
      });
    } catch (parseError) {
      console.error("=== ERRO AO FAZER PARSE DO BODY ===");
      console.error("Tipo:", parseError?.constructor?.name);
      console.error("Mensagem:", parseError?.message);
      console.error("Stack:", parseError?.stack);
      return new Response(JSON.stringify({
        error: "Erro ao processar dados da requisição: " + (parseError.message || "Formato inválido")
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Validações básicas
    if (!input.aluno_id || !input.data_inicio || !input.data_fim) {
      return new Response(JSON.stringify({
        error: "Campos obrigatórios: aluno_id, data_inicio, data_fim"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Verificar se aluno_id corresponde ao usuário autenticado
    if (input.aluno_id !== userId) {
      return new Response(JSON.stringify({
        error: "Você só pode criar cronogramas para si mesmo"
      }), {
        status: 403,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Validar datas
    const dataInicio = new Date(input.data_inicio);
    const dataFim = new Date(input.data_fim);
    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
      return new Response(JSON.stringify({
        error: "Datas inválidas"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (dataFim <= dataInicio) {
      return new Response(JSON.stringify({
        error: "data_fim deve ser posterior a data_inicio"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const prioridadeMinimaEfetiva = Math.max(1, input.prioridade_minima ?? 1);
    const cursoId = input.curso_alvo_id || null;
    const modulosSelecionados = Array.isArray(input.modulos_ids) ? input.modulos_ids : [];
    // ============================================
    // ETAPA 1: Cálculo de Capacidade
    // ============================================
    interface Semana {
      numero: number;
      data_inicio: Date;
      data_fim: Date;
      is_ferias: boolean;
      capacidade_minutos: number;
    }
    const semanas: Semana[] = [];
    const inicio = new Date(dataInicio);
    let semanaNumero = 1;
    while(inicio <= dataFim){
      const fimSemana = new Date(inicio);
      fimSemana.setDate(fimSemana.getDate() + 6); // 7 dias (0-6)
      // Verificar se a semana cai em período de férias
      let isFerias = false;
      for (const periodo of input.ferias || []){
        const inicioFerias = new Date(periodo.inicio);
        const fimFerias = new Date(periodo.fim);
        if (inicio >= inicioFerias && inicio <= fimFerias || fimSemana >= inicioFerias && fimSemana <= fimFerias || inicio <= inicioFerias && fimSemana >= fimFerias) {
          isFerias = true;
          break;
        }
      }
      semanas.push({
        numero: semanaNumero,
        data_inicio: new Date(inicio),
        data_fim: fimSemana > dataFim ? new Date(dataFim) : fimSemana,
        is_ferias: isFerias,
        capacidade_minutos: isFerias ? 0 : input.horas_dia * input.dias_semana * 60
      });
      inicio.setDate(inicio.getDate() + 7);
      semanaNumero++;
    }
    const capacidadeTotal = semanas.filter((s)=>!s.is_ferias).reduce((acc, s)=>acc + s.capacidade_minutos, 0);
    const excluirConcluidas = input.excluir_aulas_concluidas !== false;
    const aulasConcluidas = excluirConcluidas
      ? await buscarAulasConcluidas(supabaseAdmin, userId, cursoId)
      : new Set<string>();
    // ============================================
    // ETAPA 2: Busca e Filtragem de Aulas
    // ============================================
    // Buscar frentes das disciplinas selecionadas
    // Usar supabaseAdmin para bypass RLS (já validamos o usuário acima)
    let frentesQuery = supabaseAdmin.from("frentes").select("id").in("disciplina_id", input.disciplinas_ids);
    if (cursoId) {
      frentesQuery = frentesQuery.eq("curso_id", cursoId);
    }
    const { data: frentesData, error: frentesError } = await frentesQuery;
    if (frentesError) {
      console.error("Erro ao buscar frentes:", frentesError);
      return new Response(JSON.stringify({
        error: "Erro ao buscar frentes: " + frentesError.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const frenteIds = frentesData?.map((f)=>f.id) || [];
    if (frenteIds.length === 0) {
      return new Response(JSON.stringify({
        error: "Nenhuma frente encontrada para as disciplinas selecionadas"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Buscar módulos das frentes
    let modulosQuery = supabaseAdmin.from("modulos").select("id").in("frente_id", frenteIds);
    if (cursoId) {
      modulosQuery = modulosQuery.eq("curso_id", cursoId);
    }
    const { data: modulosData, error: modulosError } = await modulosQuery;
    if (modulosError) {
      console.error("Erro ao buscar módulos:", modulosError);
      return new Response(JSON.stringify({
        error: "Erro ao buscar módulos: " + modulosError.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    let moduloIds = modulosData?.map((m)=>m.id) || [];
    if (modulosSelecionados.length > 0) {
      moduloIds = moduloIds.filter((id)=>modulosSelecionados.includes(id));
    }
    if (moduloIds.length === 0) {
      return new Response(JSON.stringify({
        error: "Nenhum módulo encontrado para as frentes selecionadas"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Buscar aulas dos módulos com filtro de prioridade
    let aulasQuery = supabaseAdmin.from("aulas").select(`
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
      `).in("modulo_id", moduloIds).gte("prioridade", prioridadeMinimaEfetiva).neq("prioridade", 0);
    if (cursoId) {
      aulasQuery = aulasQuery.eq("curso_id", cursoId);
    }
    const { data: aulasData, error: aulasError } = await aulasQuery;
    if (aulasError) {
      console.error("Erro ao buscar aulas:", aulasError);
      return new Response(JSON.stringify({
        error: "Erro ao buscar aulas: " + aulasError.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (!aulasData || aulasData.length === 0) {
      return new Response(JSON.stringify({
        error: "Nenhuma aula encontrada com os critérios fornecidos"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Mapear dados para estrutura mais simples
    let aulas = aulasData.map((aula)=>({
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
        disciplina_nome: aula.modulos.frentes.disciplinas.nome
      }));
    if (excluirConcluidas && aulasConcluidas.size > 0) {
      aulas = aulas.filter((aula)=>!aulasConcluidas.has(aula.id));
      if (aulas.length === 0) {
        return new Response(JSON.stringify({
          error: "Nenhuma aula restante após excluir concluídas"
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }
    }
    // Ordenar aulas: Disciplina > Frente > Numero Modulo > Numero Aula
    aulas.sort((a, b)=>{
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
    const aulasComCusto = aulas.map((aula)=>({
        ...aula,
        custo: (aula.tempo_estimado_minutos ?? TEMPO_PADRAO_MINUTOS) * FATOR_MULTIPLICADOR
      }));
    const custoTotalNecessario = aulasComCusto.reduce((acc, aula)=>acc + aula.custo, 0);
    // ============================================
    // ETAPA 4: Verificação de Viabilidade
    // ============================================
    if (custoTotalNecessario > capacidadeTotal) {
      const horasNecessarias = custoTotalNecessario / 60;
      const horasDisponiveis = capacidadeTotal / 60;
      const semanasUteis = semanas.filter((s)=>!s.is_ferias).length;
      const horasDiaNecessarias = horasNecessarias / (semanasUteis * input.dias_semana);
      return new Response(JSON.stringify({
        error: "Tempo insuficiente",
        detalhes: {
          horas_necessarias: Math.ceil(horasNecessarias),
          horas_disponiveis: Math.ceil(horasDisponiveis),
          horas_dia_necessarias: Math.ceil(horasDiaNecessarias * 10) / 10,
          horas_dia_atual: input.horas_dia
        }
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // ============================================
    // ETAPA 5: Algoritmo de Distribuição
    // ============================================
    // Agrupar aulas por frente
    const frentesMap = new Map();
    for (const aula of aulasComCusto){
      if (!frentesMap.has(aula.frente_id)) {
        frentesMap.set(aula.frente_id, {
          frente_id: aula.frente_id,
          frente_nome: aula.frente_nome,
          aulas: [],
          custo_total: 0,
          peso: 0
        });
      }
      const frente = frentesMap.get(aula.frente_id);
      frente.aulas.push(aula);
      frente.custo_total += aula.custo;
    }
    const frentes = Array.from(frentesMap.values());
    // Calcular pesos (modo paralelo)
    if (input.modalidade === "paralelo") {
      frentes.forEach((frente)=>{
        frente.peso = frente.custo_total / custoTotalNecessario;
      });
    }
    // Ordenar frentes (modo sequencial)
    if (input.modalidade === "sequencial" && input.ordem_frentes_preferencia) {
      const ordemMap = new Map(input.ordem_frentes_preferencia.map((nome, idx)=>[
          nome,
          idx
        ]));
      frentes.sort((a, b)=>{
        const ordemA = ordemMap.get(a.frente_nome) ?? Infinity;
        const ordemB = ordemMap.get(b.frente_nome) ?? Infinity;
        return Number(ordemA) - Number(ordemB);
      });
    }
    interface CronogramaItem {
      cronograma_id: string;
      aula_id: string;
      semana_numero: number;
      ordem_na_semana: number;
    }
    const itens: CronogramaItem[] = [];
    const semanasUteis = semanas.filter((s)=>!s.is_ferias);
    let frenteIndex = 0;
    const aulaIndexPorFrente = new Map<string, number>();
    // Inicializar índices de aula por frente
    frentes.forEach((frente)=>{
      aulaIndexPorFrente.set(frente.frente_id, 0);
    });
    if (input.modalidade === "paralelo") {
      // Modo Paralelo: Distribuir proporcionalmente
      for (const semana of semanasUteis){
        const capacidadeSemanal = semana.capacidade_minutos;
        let tempoUsado = 0;
        let ordemNaSemana = 1;
        // Distribuir cada frente proporcionalmente
        for (const frente of frentes){
          const cotaFrente = capacidadeSemanal * frente.peso;
          let tempoFrenteUsado = 0;
          let aulaIndex = aulaIndexPorFrente.get(frente.frente_id) ?? 0;
          while(aulaIndex < frente.aulas.length && tempoFrenteUsado + frente.aulas[aulaIndex].custo <= cotaFrente && tempoUsado + frente.aulas[aulaIndex].custo <= capacidadeSemanal){
            itens.push({
              cronograma_id: "",
              aula_id: frente.aulas[aulaIndex].id,
              semana_numero: semana.numero,
              ordem_na_semana: ordemNaSemana++
            });
            tempoFrenteUsado += frente.aulas[aulaIndex].custo;
            tempoUsado += frente.aulas[aulaIndex].custo;
            aulaIndex++;
          }
          aulaIndexPorFrente.set(frente.frente_id, aulaIndex);
        }
        // Fallback: Se sobrou tempo, preencher com aulas restantes
        for (const frente of frentes){
          let aulaIndex = aulaIndexPorFrente.get(frente.frente_id) ?? 0;
          while(aulaIndex < frente.aulas.length && tempoUsado + frente.aulas[aulaIndex].custo <= capacidadeSemanal){
            itens.push({
              cronograma_id: "",
              aula_id: frente.aulas[aulaIndex].id,
              semana_numero: semana.numero,
              ordem_na_semana: ordemNaSemana++
            });
            tempoUsado += frente.aulas[aulaIndex].custo;
            aulaIndex++;
          }
          aulaIndexPorFrente.set(frente.frente_id, aulaIndex);
        }
      }
    } else {
      // Modo Sequencial: Completar uma frente antes de iniciar próxima
      for (const semana of semanasUteis){
        const capacidadeSemanal = semana.capacidade_minutos;
        let tempoUsado = 0;
        let ordemNaSemana = 1;
        while(frenteIndex < frentes.length && tempoUsado < capacidadeSemanal){
          const frente = frentes[frenteIndex];
          let aulaIndex = aulaIndexPorFrente.get(frente.frente_id) ?? 0;
          if (aulaIndex >= frente.aulas.length) {
            frenteIndex++;
            continue;
          }
          if (tempoUsado + frente.aulas[aulaIndex].custo <= capacidadeSemanal) {
            itens.push({
              cronograma_id: "",
              aula_id: frente.aulas[aulaIndex].id,
              semana_numero: semana.numero,
              ordem_na_semana: ordemNaSemana++
            });
            tempoUsado += frente.aulas[aulaIndex].custo;
            aulaIndex++;
            aulaIndexPorFrente.set(frente.frente_id, aulaIndex);
          } else {
            break;
          }
        }
      }
    }
    // ============================================
    // ETAPA 6: Persistência
    // ============================================
    // Criar registro do cronograma
    const { data: cronograma, error: cronogramaError } = await supabaseAdmin.from("cronogramas").insert({
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
        excluir_aulas_concluidas: excluirConcluidas
    }).select().single();
    if (cronogramaError || !cronograma) {
      console.error("Erro ao criar cronograma:", cronogramaError);
      return new Response(JSON.stringify({
        error: "Erro ao criar cronograma: " + (cronogramaError?.message || "Desconhecido")
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Preencher cronograma_id nos itens
    const itensCompleto: CronogramaItem[] = itens.map((item)=>({
        ...item,
        cronograma_id: cronograma.id
      }));
    // Bulk insert dos itens
    const { error: itensError } = await supabaseAdmin.from("cronograma_itens").insert(itensCompleto);
    if (itensError) {
      console.error("Erro ao inserir itens:", itensError);
      // Tentar deletar o cronograma criado
      await supabaseAdmin.from("cronogramas").delete().eq("id", cronograma.id);
      return new Response(JSON.stringify({
        error: "Erro ao inserir itens do cronograma: " + itensError.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Buscar cronograma completo com itens
    const { data: cronogramaCompleto, error: fetchError } = await supabaseAdmin.from("cronogramas").select(`
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
      `).eq("id", cronograma.id).single();
    if (fetchError) {
      console.error("Erro ao buscar cronograma completo:", fetchError);
    }
    return new Response(JSON.stringify({
      success: true,
      cronograma: cronogramaCompleto || cronograma,
      estatisticas: {
        total_aulas: aulas.length,
        total_semanas: semanas.length,
        semanas_uteis: semanasUteis.length,
        capacidade_total_minutos: capacidadeTotal,
        custo_total_minutos: custoTotalNecessario,
        frentes_distribuidas: frentes.length
      }
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("=== ERRO INESPERADO ===");
    console.error("Tipo do erro:", error?.constructor?.name);
    console.error("Mensagem:", error instanceof Error ? error.message : String(error));
    console.error("Stack:", error instanceof Error ? error.stack : "N/A");
    console.error("Erro completo:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return new Response(JSON.stringify({
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : String(error),
      tipo: error?.constructor?.name || "Unknown"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
