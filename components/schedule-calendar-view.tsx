'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { CalendarDatePicker } from '@/components/calendar-date-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { format, addDays, startOfWeek, isSameDay, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'

interface CronogramaItem {
  id: string
  aula_id: string
  semana_numero: number
  ordem_na_semana: number
  concluido: boolean
  data_conclusao: string | null
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
        }
      }
    }
  } | null
}

interface Cronograma {
  id: string
  nome: string
  data_inicio: string
  data_fim: string
  dias_estudo_semana: number
  horas_estudo_dia: number
  modalidade_estudo: 'paralelo' | 'sequencial'
  cronograma_itens: CronogramaItem[]
  curso_alvo_id?: string | null
  periodos_ferias?: Array<{ inicio: string; fim: string }>
}

interface ScheduleCalendarViewProps {
  cronogramaId: string
}

interface ItemComData extends CronogramaItem {
  data: Date
}

export function ScheduleCalendarView({ cronogramaId }: ScheduleCalendarViewProps) {
  const [loading, setLoading] = useState(true)
  const [cronograma, setCronograma] = useState<Cronograma | null>(null)
  const [itensPorData, setItensPorData] = useState<Map<string, ItemComData[]>>(new Map())
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadCronograma() {
      if (!cronogramaId) {
        console.error('cronogramaId não fornecido')
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        
        const { data: userResponse } = await supabase.auth.getUser()
        setUserId(userResponse?.user?.id ?? null)

        // Carregar cronograma
        const { data: cronogramaData, error: cronogramaError } = await supabase
          .from('cronogramas')
          .select('*')
          .eq('id', cronogramaId)
          .single()

        if (cronogramaError || !cronogramaData) {
          console.error('Erro ao carregar cronograma:', cronogramaError)
          setLoading(false)
          return
        }

        // Carregar itens
        const { data: itensData, error: itensError } = await supabase
          .from('cronograma_itens')
          .select('id, aula_id, semana_numero, ordem_na_semana, concluido, data_conclusao')
          .eq('cronograma_id', cronogramaId)
          .order('semana_numero', { ascending: true })
          .order('ordem_na_semana', { ascending: true })

        if (itensError) {
          console.error('Erro ao carregar itens:', itensError)
        }

        // Carregar aulas
        let itensCompletos: any[] = []
        if (itensData && itensData.length > 0) {
          const aulaIds = [...new Set(itensData.map(item => item.aula_id).filter(Boolean))]
          
          if (aulaIds.length > 0) {
            // Buscar aulas em lotes
            const LOTE_SIZE = 100
            const lotes = []
            for (let i = 0; i < aulaIds.length; i += LOTE_SIZE) {
              lotes.push(aulaIds.slice(i, i + LOTE_SIZE))
            }
            
            const todasAulas: any[] = []
            for (const lote of lotes) {
              const { data: loteData, error: loteError } = await supabase
                .from('aulas')
                .select('id, nome, numero_aula, tempo_estimado_minutos, curso_id, modulo_id')
                .in('id', lote)
              
              if (!loteError && loteData) {
                todasAulas.push(...loteData)
              }
            }

            // Buscar módulos
            const moduloIds = [...new Set(todasAulas.map(a => a.modulo_id).filter(Boolean))]
            let modulosMap = new Map()
            
            if (moduloIds.length > 0) {
              const { data: modulosData } = await supabase
                .from('modulos')
                .select('id, nome, numero_modulo, frente_id')
                .in('id', moduloIds)

              if (modulosData) {
                modulosMap = new Map(modulosData.map(m => [m.id, m]))
              }
            }

            // Buscar frentes
            const frenteIds = [...new Set(Array.from(modulosMap.values()).map((m: any) => m.frente_id).filter(Boolean))]
            let frentesMap = new Map()
            
            if (frenteIds.length > 0) {
              const { data: frentesData } = await supabase
                .from('frentes')
                .select('id, nome, disciplina_id')
                .in('id', frenteIds)

              if (frentesData) {
                frentesMap = new Map(frentesData.map(f => [f.id, f]))
              }
            }

            // Buscar disciplinas
            const disciplinaIds = [...new Set(Array.from(frentesMap.values()).map((f: any) => f.disciplina_id).filter(Boolean))]
            let disciplinasMap = new Map()
            
            if (disciplinaIds.length > 0) {
              const { data: disciplinasData } = await supabase
                .from('disciplinas')
                .select('id, nome')
                .in('id', disciplinaIds)

              if (disciplinasData) {
                disciplinasMap = new Map(disciplinasData.map(d => [d.id, d]))
              }
            }

            // Montar estrutura completa
            const aulasCompletas = todasAulas.map(aula => {
              const modulo = modulosMap.get(aula.modulo_id)
              const frente = modulo ? frentesMap.get((modulo as any).frente_id) : null
              const disciplina = frente ? disciplinasMap.get((frente as any).disciplina_id) : null

              return {
                id: aula.id,
                nome: aula.nome,
                numero_aula: aula.numero_aula,
                tempo_estimado_minutos: aula.tempo_estimado_minutos,
                curso_id: aula.curso_id,
                modulos: modulo ? {
                  id: (modulo as any).id,
                  nome: (modulo as any).nome,
                  numero_modulo: (modulo as any).numero_modulo,
                  frentes: frente ? {
                    id: (frente as any).id,
                    nome: (frente as any).nome,
                    disciplinas: disciplina ? {
                      id: (disciplina as any).id,
                      nome: (disciplina as any).nome,
                    } : null,
                  } : null,
                } : null,
              }
            })

            const aulasMap = new Map(aulasCompletas.map(aula => [aula.id, aula]))

            itensCompletos = itensData.map(item => ({
              ...item,
              aulas: aulasMap.get(item.aula_id) || null,
            }))
          }
        }

        const data = {
          ...cronogramaData,
          cronograma_itens: itensCompletos,
        }

        setCronograma(data as Cronograma)

        // Calcular datas dos itens
        const itensComData = calcularDatasItens(data as Cronograma)
        const mapaPorData = new Map<string, ItemComData[]>()
        
        itensComData.forEach(item => {
          const dataKey = format(item.data, 'yyyy-MM-dd')
          if (!mapaPorData.has(dataKey)) {
            mapaPorData.set(dataKey, [])
          }
          mapaPorData.get(dataKey)!.push(item)
        })

        setItensPorData(mapaPorData)

        // Definir range inicial
        if (data.data_inicio && data.data_fim) {
          setDateRange({
            from: new Date(data.data_inicio),
            to: new Date(data.data_fim),
          })
        }
      } catch (err) {
        console.error('Erro inesperado ao carregar cronograma:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCronograma()
  }, [cronogramaId])

  const calcularDatasItens = (cronograma: Cronograma): ItemComData[] => {
    const dataInicio = new Date(cronograma.data_inicio)
    const diasEstudoSemana = cronograma.dias_estudo_semana || 7
    const itensComData: ItemComData[] = []

    // Agrupar itens por semana e ordenar por ordem_na_semana
    const itensPorSemana = new Map<number, CronogramaItem[]>()
    cronograma.cronograma_itens.forEach(item => {
      if (!itensPorSemana.has(item.semana_numero)) {
        itensPorSemana.set(item.semana_numero, [])
      }
      itensPorSemana.get(item.semana_numero)!.push(item)
    })

    // Ordenar itens dentro de cada semana
    itensPorSemana.forEach((itens, semanaNumero) => {
      itens.sort((a, b) => a.ordem_na_semana - b.ordem_na_semana)
    })

    // Calcular data de cada item
    itensPorSemana.forEach((itens, semanaNumero) => {
      const inicioSemana = addDays(dataInicio, (semanaNumero - 1) * 7)
      const inicioSemanaUtil = startOfWeek(inicioSemana, { weekStartsOn: 1 }) // Segunda-feira

      itens.forEach((item) => {
        // Distribuir itens ao longo dos dias de estudo da semana
        // ordem_na_semana começa em 1, então subtraímos 1 para indexar de 0
        const diaNaSemana = (item.ordem_na_semana - 1) % diasEstudoSemana
        const dataItem = addDays(inicioSemanaUtil, diaNaSemana)
        
        itensComData.push({
          ...item,
          data: dataItem,
        })
      })
    })

    return itensComData
  }

  const toggleConcluido = async (itemId: string, concluido: boolean) => {
    const supabase = createClient()
    
    const updateData: any = { concluido }
    if (concluido) {
      updateData.data_conclusao = new Date().toISOString()
    } else {
      updateData.data_conclusao = null
    }

    const { error } = await supabase
      .from('cronograma_itens')
      .update(updateData)
      .eq('id', itemId)

    if (error) {
      console.error('Erro ao atualizar item:', error)
      return
    }

    const itemAlvo = cronograma?.cronograma_itens.find((item) => item.id === itemId)
    const alunoAtual = userId || (await supabase.auth.getUser()).data?.user?.id || null
    const cursoDaAula = itemAlvo?.aulas?.curso_id || cronograma?.curso_alvo_id || null

    if (itemAlvo?.aula_id && alunoAtual && cursoDaAula) {
      if (concluido) {
        await supabase
          .from('aulas_concluidas')
          .upsert(
            {
              aluno_id: alunoAtual,
              aula_id: itemAlvo.aula_id,
              curso_id: cursoDaAula,
            },
            { onConflict: 'aluno_id,aula_id' },
          )
      } else {
        await supabase
          .from('aulas_concluidas')
          .delete()
          .eq('aluno_id', alunoAtual)
          .eq('aula_id', itemAlvo.aula_id)
      }
    }

    // Atualizar estado local
    if (cronograma) {
      const updatedItems = cronograma.cronograma_itens.map((item) =>
        item.id === itemId
          ? { ...item, concluido, data_conclusao: updateData.data_conclusao }
          : item
      )
      setCronograma({ ...cronograma, cronograma_itens: updatedItems })

      // Atualizar mapa de itens por data
      const itensComData = calcularDatasItens({ ...cronograma, cronograma_itens: updatedItems })
      const mapaPorData = new Map<string, ItemComData[]>()
      
      itensComData.forEach(item => {
        const dataKey = format(item.data, 'yyyy-MM-dd')
        if (!mapaPorData.has(dataKey)) {
          mapaPorData.set(dataKey, [])
        }
        mapaPorData.get(dataKey)!.push(item)
      })

      setItensPorData(mapaPorData)
    }
  }

  const formatTempo = (minutes: number | null) => {
    if (!minutes) return '--'
    const rounded = Math.max(0, Math.round(minutes))
    const hours = Math.floor(rounded / 60)
    const mins = rounded % 60
    const parts = []
    if (hours > 0) parts.push(`${hours}h`)
    if (mins > 0) parts.push(`${mins} min`)
    return parts.length === 0 ? '0 min' : parts.join(' ')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!cronograma) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Cronograma não encontrado</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const totalItens = cronograma.cronograma_itens.length
  const itensConcluidos = cronograma.cronograma_itens.filter((item) => item.concluido).length
  const progressoPercentual = totalItens > 0 ? (itensConcluidos / totalItens) * 100 : 0

  // Função para marcar dias com aulas
  const modifiers = {
    hasAulas: (date: Date) => {
      const dataKey = format(date, 'yyyy-MM-dd')
      return itensPorData.has(dataKey)
    },
    hasConcluidas: (date: Date) => {
      const dataKey = format(date, 'yyyy-MM-dd')
      const itens = itensPorData.get(dataKey) || []
      return itens.some(item => item.concluido)
    },
  }

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-2 md:px-4">
      {/* Header com Resumo */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg md:text-xl">{cronograma.nome || 'Meu Cronograma'}</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {format(new Date(cronograma.data_inicio), "dd 'de' MMMM", { locale: ptBR })} -{' '}
                {format(new Date(cronograma.data_fim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso Geral</span>
              <span>{itensConcluidos} de {totalItens} aulas concluídas</span>
            </div>
            <Progress value={progressoPercentual} />
            <p className="text-xs text-muted-foreground">
              {progressoPercentual.toFixed(1)}% completo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calendário */}
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Estudos</CardTitle>
          <CardDescription>
            Visualize suas aulas agendadas e marque as concluídas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seletor de Range */}
          <div className="flex flex-col gap-4">
            <CalendarDatePicker
              date={dateRange}
              onDateSelect={setDateRange}
              numberOfMonths={2}
            />
          </div>

          {/* Calendário com marcações */}
          <div className="flex flex-col md:flex-row gap-4">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              modifiers={modifiers}
              modifiersClassNames={{
                hasAulas: 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800',
                hasConcluidas: 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800',
              }}
              numberOfMonths={2}
              className="rounded-md border"
            />
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800" />
              <span>Dia com aulas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" />
              <span>Dia com aulas concluídas</span>
            </div>
          </div>

          {/* Lista de itens por data (quando uma data é selecionada) */}
          {dateRange?.from && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">
                Aulas do período selecionado
              </h3>
              <div className="space-y-2">
                {Array.from(itensPorData.entries())
                  .filter(([dataKey]) => {
                    if (!dateRange.from || !dateRange.to) return false
                    const data = new Date(dataKey)
                    return isWithinInterval(data, {
                      start: dateRange.from,
                      end: dateRange.to,
                    })
                  })
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dataKey, itens]) => (
                    <Card key={dataKey}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {format(new Date(dataKey), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {itens.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-3 rounded-md border hover:bg-accent/50 transition-colors"
                            >
                              <Checkbox
                                checked={item.concluido}
                                onCheckedChange={(checked) =>
                                  toggleConcluido(item.id, checked === true)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">
                                      {item.aulas?.nome || 'Aula sem nome'}
                                    </p>
                                    {item.aulas?.modulos?.frentes?.disciplinas && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {item.aulas.modulos.frentes.disciplinas.nome}
                                        {item.aulas.modulos.nome && ` • ${item.aulas.modulos.nome}`}
                                      </p>
                                    )}
                                    {item.aulas?.tempo_estimado_minutos && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Tempo estimado: {formatTempo(item.aulas.tempo_estimado_minutos)}
                                      </p>
                                    )}
                                  </div>
                                  {item.concluido && (
                                    <Badge variant="default" className="text-xs">
                                      Concluída
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

