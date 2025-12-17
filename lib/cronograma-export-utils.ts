import { getDatabaseClient } from '@/backend/clients/database'

interface CronogramaData {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  [key: string]: unknown;
}

export interface CronogramaCompleto {
  cronograma: CronogramaData
  itens: Array<{
    id: string
    aula_id: string
    semana_numero: number
    ordem_na_semana: number
    concluido: boolean
    data_conclusao: string | null
    data_prevista: string | null
    aulas: {
      id: string
      nome: string
      numero_aula: number | null
      tempo_estimado_minutos: number | null
      curso_id: string | null
      modulos: {
        id: string
        nome: string
        numero_modulo: number | null
        frentes: {
          id: string
          nome: string
          disciplinas: {
            id: string
            nome: string
          } | null
        } | null
      } | null
    } | null
  }>
}

export async function fetchCronogramaCompleto(cronogramaId: string): Promise<CronogramaCompleto> {
  const client = getDatabaseClient()
  const { data: cronograma, error: cronogramaError } = await client
    .from('cronogramas')
    .select('*')
    .eq('id', cronogramaId)
    .single()
  if (cronogramaError || !cronograma) throw new Error('Cronograma não encontrado')

  const { data: itens } = await client
    .from('cronograma_itens')
    .select('id, aula_id, semana_numero, ordem_na_semana, concluido, data_conclusao, data_prevista')
    .eq('cronograma_id', cronogramaId)
    .order('semana_numero', { ascending: true })
    .order('ordem_na_semana', { ascending: true })

  interface AulaData {
    id: string;
    nome: string;
    numero_aula: number | null;
    tempo_estimado_minutos: number | null;
    curso_id: string | null;
    modulo_id: string | null;
  }

  interface ModuloData {
    id: string;
    nome: string;
    numero_modulo: number | null;
    frente_id: string;
  }

  interface FrenteData {
    id: string;
    nome: string;
    disciplina_id: string;
  }

  interface DisciplinaData {
    id: string;
    nome: string;
  }

  const aulaIds = [...new Set((itens || []).map((i) => i.aula_id).filter(Boolean))]
  let aulasMap = new Map<string, unknown>()
  if (aulaIds.length) {
    const LOTE = 100
    const todasAulas: AulaData[] = []
    for (let i = 0; i < aulaIds.length; i += LOTE) {
      const { data: lote } = await client
        .from('aulas')
        .select('id, nome, numero_aula, tempo_estimado_minutos, curso_id, modulo_id')
        .in('id', aulaIds.slice(i, i + LOTE))
      if (lote) todasAulas.push(...lote)
    }

    const moduloIds = [...new Set(todasAulas.map((a) => a.modulo_id).filter(Boolean))]
    let modulosMap = new Map<string, any>()
    if (moduloIds.length) {
      const { data: modulos } = await client
        .from('modulos')
        .select('id, nome, numero_modulo, frente_id')
        .in('id', moduloIds)
      if (modulos) modulosMap = new Map(modulos.map((m: any) => [m.id, m]))
    }

    const frenteIds = [...new Set(Array.from(modulosMap.values()).map((m: any) => m.frente_id).filter(Boolean))]
    let frentesMap = new Map<string, any>()
    if (frenteIds.length) {
      const { data: frentes } = await client
        .from('frentes')
        .select('id, nome, disciplina_id')
        .in('id', frenteIds)
      if (frentes) frentesMap = new Map(frentes.map((f: any) => [f.id, f]))
    }

    const disciplinaIds = [...new Set(Array.from(frentesMap.values()).map((f: any) => f.disciplina_id).filter(Boolean))]
    let disciplinasMap = new Map<string, any>()
    if (disciplinaIds.length) {
      const { data: disciplinas } = await client
        .from('disciplinas')
        .select('id, nome')
        .in('id', disciplinaIds)
      if (disciplinas) disciplinasMap = new Map(disciplinas.map((d: any) => [d.id, d]))
    }

    aulasMap = new Map(
      todasAulas.map((a) => {
        const modulo = modulosMap.get(a.modulo_id)
        const frente = modulo ? frentesMap.get(modulo.frente_id) : null
        const disciplina = frente ? disciplinasMap.get(frente.disciplina_id) : null
        return [
          a.id,
          {
            id: a.id,
            nome: a.nome,
            numero_aula: a.numero_aula,
            tempo_estimado_minutos: a.tempo_estimado_minutos,
            curso_id: a.curso_id,
            modulos: modulo
              ? {
                  id: modulo.id,
                  nome: modulo.nome,
                  numero_modulo: modulo.numero_modulo,
                  frentes: frente
                    ? {
                        id: frente.id,
                        nome: frente.nome,
                        disciplinas: disciplina ? { id: disciplina.id, nome: disciplina.nome } : null,
                      }
                    : null,
                }
              : null,
          },
        ]
      }),
    )
  }

  const itensCompletos = (itens || []).map((item) => ({
    ...item,
    aulas: aulasMap.get(item.aula_id) || null,
  }))

  return { cronograma, itens: itensCompletos }
}




