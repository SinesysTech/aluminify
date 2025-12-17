import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RelatorioDados {
  total_agendamentos: number
  por_status: {
    confirmado: number
    cancelado: number
    concluido: number
    pendente: number
  }
  por_professor: Array<{
    professor_id: string
    nome: string
    total: number
    taxa_comparecimento: number
  }>
  taxa_ocupacao: number
  horarios_pico: string[]
  taxa_nao_comparecimento: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { empresa_id, data_inicio, data_fim, tipo } = await req.json()

    if (!empresa_id || !data_inicio || !data_fim || !tipo) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user belongs to empresa
    const { data: professor } = await supabaseClient
      .from('professores')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!professor || professor.empresa_id !== empresa_id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get professor IDs for the company
    const { data: professores } = await supabaseClient
      .from('professores')
      .select('id')
      .eq('empresa_id', empresa_id)

    const professorIds = professores?.map(p => p.id) || []

    if (professorIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No professors found for this company' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Aggregate data from agendamentos
    const { data: agendamentos, error: agendamentosError } = await supabaseClient
      .from('agendamentos')
      .select(`
        id,
        status,
        professor_id,
        data_inicio,
        data_fim,
        professor:professores!agendamentos_professor_id_fkey(nome_completo)
      `)
      .gte('data_inicio', data_inicio)
      .lte('data_fim', data_fim)
      .in('professor_id', professorIds)

    if (agendamentosError) {
      throw agendamentosError
    }

    // Calculate metrics
    const total_agendamentos = agendamentos?.length || 0

    const por_status = {
      confirmado: agendamentos?.filter(a => a.status === 'confirmado').length || 0,
      cancelado: agendamentos?.filter(a => a.status === 'cancelado').length || 0,
      concluido: agendamentos?.filter(a => a.status === 'concluido').length || 0,
      pendente: agendamentos?.filter(a => a.status === 'pendente').length || 0,
    }

    // Group by professor
    const por_professor_map = new Map<string, { professor_id: string; nome: string; total: number; concluidos: number; confirmados: number }>()
    
    agendamentos?.forEach(a => {
      const profId = a.professor_id
      if (!por_professor_map.has(profId)) {
        por_professor_map.set(profId, {
          professor_id: profId,
          nome: (a.professor as any)?.nome_completo || 'Desconhecido',
          total: 0,
          concluidos: 0,
          confirmados: 0,
        })
      }
      const prof = por_professor_map.get(profId)!
      prof.total++
      if (a.status === 'concluido') prof.concluidos++
      if (a.status === 'confirmado') prof.confirmados++
    })

    const por_professor = Array.from(por_professor_map.values()).map(p => ({
      professor_id: p.professor_id,
      nome: p.nome,
      total: p.total,
      taxa_comparecimento: p.confirmados > 0 ? p.concluidos / p.confirmados : 0,
    }))

    // Calculate taxa_ocupacao using SQL function
    const { data: taxaOcupacaoData } = await supabaseClient.rpc('calcular_taxa_ocupacao', {
      empresa_id_param: empresa_id,
      data_inicio_param: data_inicio,
      data_fim_param: data_fim,
    })

    const taxa_ocupacao = taxaOcupacaoData || 0

    // Calculate horarios_pico (most common time slots)
    const horariosMap = new Map<string, number>()
    agendamentos?.forEach(a => {
      const hora = new Date(a.data_inicio).getHours()
      const slot = `${hora.toString().padStart(2, '0')}:00-${(hora + 1).toString().padStart(2, '0')}:00`
      horariosMap.set(slot, (horariosMap.get(slot) || 0) + 1)
    })

    const horarios_pico = Array.from(horariosMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slot]) => slot)

    // Calculate taxa_nao_comparecimento
    const confirmados = por_status.confirmado
    const concluidos = por_status.concluido
    const taxa_nao_comparecimento = confirmados > 0 ? (confirmados - concluidos) / confirmados : 0

    // Build relatorio data
    const dados_json: RelatorioDados = {
      total_agendamentos,
      por_status,
      por_professor,
      taxa_ocupacao,
      horarios_pico,
      taxa_nao_comparecimento,
    }

    // Save to agendamento_relatorios
    const { data: relatorio, error: relatorioError } = await supabaseClient
      .from('agendamento_relatorios')
      .insert({
        empresa_id,
        periodo_inicio: data_inicio,
        periodo_fim: data_fim,
        tipo: tipo as 'mensal' | 'semanal' | 'customizado',
        dados_json,
        gerado_por: user.id,
      })
      .select()
      .single()

    if (relatorioError) {
      throw relatorioError
    }

    return new Response(
      JSON.stringify({ relatorio }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

