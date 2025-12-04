'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScheduleList } from '@/components/schedule-list'
import { Download, Plus, RefreshCw, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

const formatHorasFromMinutes = (minutos?: number | null) => {
  if (!minutos || minutos <= 0) {
    return '--'
  }

  const horas = minutos / 60
  const isInt = Number.isInteger(horas)

  return `${horas.toLocaleString('pt-BR', {
    minimumFractionDigits: isInt ? 0 : 1,
    maximumFractionDigits: 1,
  })}h`
}

const formatDateSafe = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'Data inválida'
  }

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Data inválida'
    }
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  } catch (error) {
    return 'Data inválida'
  }
}

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
  }
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
  prioridade_minima?: number
  disciplinas_selecionadas?: string[]
  velocidade_reproducao?: number
}

export function ScheduleDashboard({ cronogramaId }: { cronogramaId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cronograma, setCronograma] = useState<Cronograma | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [curso, setCurso] = useState<{ id: string; nome: string } | null>(null)
  const [disciplinas, setDisciplinas] = useState<Array<{ id: string; nome: string }>>([])

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

        // Try to load cronograma first, then items separately to avoid nested query issues
        const { data: cronogramaData, error: cronogramaError } = await supabase
          .from('cronogramas')
          .select('*')
          .eq('id', cronogramaId)
          .single()

        if (cronogramaError) {
          console.error('Erro ao carregar cronograma base:', {
            message: cronogramaError.message,
            details: cronogramaError.details,
            hint: cronogramaError.hint,
            code: cronogramaError.code,
            cronogramaId,
          })
          setLoading(false)
          return
        }

        if (!cronogramaData) {
          console.error('Cronograma não encontrado para o ID:', cronogramaId)
          setLoading(false)
          return
        }

        // Now load the items first without nested relationships
        console.log('[ScheduleDashboard] Buscando itens do cronograma:', cronogramaId)
        const { data: itensData, error: itensError } = await supabase
          .from('cronograma_itens')
          .select('id, aula_id, semana_numero, ordem_na_semana, concluido, data_conclusao')
          .eq('cronograma_id', cronogramaId)
          .order('semana_numero', { ascending: true })
          .order('ordem_na_semana', { ascending: true })

        if (itensError) {
          console.error('[ScheduleDashboard] Erro ao carregar itens do cronograma:', {
            message: itensError.message,
            details: itensError.details,
            hint: itensError.hint,
            code: itensError.code,
            cronogramaId,
          })
          // Continue anyway with empty items
        } else {
          console.log('[ScheduleDashboard] Itens carregados:', {
            total: itensData?.length || 0,
            primeirosItens: itensData?.slice(0, 3).map(i => ({
              id: i.id,
              aula_id: i.aula_id,
              semana_numero: i.semana_numero,
              ordem_na_semana: i.ordem_na_semana,
            })),
          })
        }

        // Load aulas separately and map them to items
        let itensCompletos: any[] = []
        if (itensData && itensData.length > 0) {
          const aulaIds = [...new Set(itensData.map(item => item.aula_id).filter(Boolean))]
          
          if (aulaIds.length > 0) {
            console.log('[ScheduleDashboard] Buscando aulas:', aulaIds.length, 'aulas')
            
            // Load aulas with their relationships - usando joins mais simples
            // Primeiro buscar aulas básicas - garantir que temos pelo menos os dados básicos
            console.log('[ScheduleDashboard] Buscando', aulaIds.length, 'aulas com IDs:', aulaIds.slice(0, 3), '...')
            
            // Dividir em lotes de 100 IDs para evitar problemas com queries muito grandes
            const LOTE_SIZE = 100
            const lotes = []
            for (let i = 0; i < aulaIds.length; i += LOTE_SIZE) {
              lotes.push(aulaIds.slice(i, i + LOTE_SIZE))
            }
            
            console.log('[ScheduleDashboard] Dividindo em', lotes.length, 'lotes de até', LOTE_SIZE, 'IDs cada')
            
            // Buscar aulas em lotes
            const todasAulas: any[] = []
            let aulasBasicasError: any = null
            
            for (let i = 0; i < lotes.length; i++) {
              const lote = lotes[i]
              console.log(`[ScheduleDashboard] Buscando lote ${i + 1}/${lotes.length} com ${lote.length} IDs...`)
              
              const { data: loteData, error: loteError } = await supabase
                .from('aulas')
                .select('id, nome, numero_aula, tempo_estimado_minutos, curso_id, modulo_id')
                .in('id', lote)
              
              if (loteError) {
                console.error(`[ScheduleDashboard] Erro no lote ${i + 1}/${lotes.length}:`, {
                  message: loteError.message,
                  details: loteError.details,
                  hint: loteError.hint,
                  code: loteError.code,
                  loteSize: lote.length,
                  firstIdInLote: lote[0],
                })
                // Não parar completamente, apenas marcar o erro
                if (!aulasBasicasError) {
                  aulasBasicasError = loteError
                }
              } else if (loteData) {
                todasAulas.push(...loteData)
                console.log(`[ScheduleDashboard] ✓ Lote ${i + 1}/${lotes.length} retornou ${loteData.length} aulas`)
              } else {
                console.warn(`[ScheduleDashboard] ⚠️ Lote ${i + 1}/${lotes.length} retornou null/undefined`)
              }
            }
            
            const aulasBasicas = todasAulas.length > 0 ? todasAulas : null

            if (aulasBasicasError) {
              console.error('[ScheduleDashboard] Erro ao carregar aulas básicas:', {
                message: aulasBasicasError.message,
                details: aulasBasicasError.details,
                hint: aulasBasicasError.hint,
                code: aulasBasicasError.code,
                aulaIdsCount: aulaIds.length,
                firstIds: aulaIds.slice(0, 3),
              })
              // Se houver erro, ainda assim tentar continuar com array vazio para não quebrar
            }

            if (!aulasBasicas || aulasBasicas.length === 0) {
              console.error('[ScheduleDashboard] ⚠️ Nenhuma aula encontrada após buscar em lotes!')
              console.error('[ScheduleDashboard] IDs buscados:', aulaIds.length, 'IDs:', aulaIds.slice(0, 10))
              console.error('[ScheduleDashboard] Erro da query:', aulasBasicasError)
              
              // Tentar buscar uma por uma para debug
              if (aulaIds.length > 0) {
                console.log('[ScheduleDashboard] Tentando buscar primeira aula individualmente para debug...')
                const { data: testAula, error: testError } = await supabase
                  .from('aulas')
                  .select('id, nome, modulo_id')
                  .eq('id', aulaIds[0])
                  .single()
                
                console.log('[ScheduleDashboard] Teste individual - aula:', testAula)
                console.log('[ScheduleDashboard] Teste individual - erro:', testError)
                if (testError) {
                  console.error('[ScheduleDashboard] Detalhes do erro individual:', {
                    message: testError.message,
                    details: testError.details,
                    hint: testError.hint,
                    code: testError.code,
                  })
                }
              }
            } else {
              console.log('[ScheduleDashboard] ✓ Aulas básicas encontradas:', aulasBasicas.length, 'de', aulaIds.length, 'IDs buscados')
              if (aulasBasicas.length > 0) {
                console.log('[ScheduleDashboard] Primeira aula:', aulasBasicas[0])
              }
              if (aulasBasicas.length < aulaIds.length) {
                const foundIds = new Set(aulasBasicas.map(a => a.id))
                const missingIds = aulaIds.filter(id => !foundIds.has(id))
                console.warn('[ScheduleDashboard] ⚠️ Algumas aulas não foram encontradas:', missingIds.length, 'faltando. Primeiros:', missingIds.slice(0, 5))
              }
              const moduloIdsUnicos = [...new Set(aulasBasicas.map(a => a.modulo_id).filter(Boolean))]
              console.log('[ScheduleDashboard] Módulos IDs das aulas:', moduloIdsUnicos.length, 'módulos únicos')
            }

            // Buscar módulos das aulas
            const moduloIds = [...new Set((aulasBasicas || []).map(a => a.modulo_id).filter(Boolean))]
            let modulosMap = new Map()
            
            if (moduloIds.length > 0) {
              const { data: modulosData, error: modulosError } = await supabase
                .from('modulos')
                .select('id, nome, numero_modulo, frente_id')
                .in('id', moduloIds)

              if (modulosError) {
                console.error('Erro ao carregar módulos:', modulosError)
              } else if (modulosData) {
                modulosMap = new Map(modulosData.map(m => [m.id, m]))
              }
            }

            // Buscar frentes dos módulos
            const frenteIds = [...new Set(Array.from(modulosMap.values()).map((m: any) => m.frente_id).filter(Boolean))]
            let frentesMap = new Map()
            
            if (frenteIds.length > 0) {
              const { data: frentesData, error: frentesError } = await supabase
                .from('frentes')
                .select('id, nome, disciplina_id')
                .in('id', frenteIds)

              if (frentesError) {
                console.error('Erro ao carregar frentes:', frentesError)
              } else if (frentesData) {
                frentesMap = new Map(frentesData.map(f => [f.id, f]))
              }
            }

            // Buscar disciplinas das frentes
            const disciplinaIds = [...new Set(Array.from(frentesMap.values()).map((f: any) => f.disciplina_id).filter(Boolean))]
            let disciplinasMap = new Map()
            
            if (disciplinaIds.length > 0) {
              const { data: disciplinasData, error: disciplinasError } = await supabase
                .from('disciplinas')
                .select('id, nome')
                .in('id', disciplinaIds)

              if (disciplinasError) {
                console.error('Erro ao carregar disciplinas:', disciplinasError)
              } else if (disciplinasData) {
                disciplinasMap = new Map(disciplinasData.map(d => [d.id, d]))
              }
            }

            // Montar estrutura completa das aulas
            const aulasCompletas = (aulasBasicas || []).map(aula => {
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

            console.log('[ScheduleDashboard] Aulas completas montadas:', aulasCompletas.length, 'de', aulasBasicas?.length || 0, 'aulas básicas')
            if (aulasCompletas.length > 0) {
              console.log('[ScheduleDashboard] Exemplo de aula completa:', JSON.stringify(aulasCompletas[0], null, 2))
            }

            // Create a lookup map for aulas
            const aulasMap = new Map(aulasCompletas.map(aula => [aula.id, aula]))

            // Map items with their aula data
            itensCompletos = itensData.map(item => {
              const aula = aulasMap.get(item.aula_id)
              if (!aula) {
                console.warn('[ScheduleDashboard] Aula não encontrada para item:', item.id, 'aula_id:', item.aula_id)
              }
              return {
                ...item,
                aulas: aula || null,
              }
            })
            
            console.log('[ScheduleDashboard] Itens completos montados:', itensCompletos.length)
            console.log('[ScheduleDashboard] Itens com aulas:', itensCompletos.filter(item => item.aulas !== null).length)
            console.log('[ScheduleDashboard] Itens sem aulas:', itensCompletos.filter(item => item.aulas === null).length)
          } else {
            // No aula_ids, just use items as-is
            itensCompletos = itensData.map(item => ({
              ...item,
              aulas: null,
            }))
          }
        }

        // Combine the data
        const data = {
          ...cronogramaData,
          cronograma_itens: itensCompletos,
        }

        // Note: We continue even if there's an error loading items,
        // as the cronograma itself loaded successfully and items might load separately

        // Ordenar itens por semana e ordem
        if (data.cronograma_itens) {
          data.cronograma_itens.sort((a: any, b: any) => {
            if (a.semana_numero !== b.semana_numero) {
              return a.semana_numero - b.semana_numero
            }
            return a.ordem_na_semana - b.ordem_na_semana
          })
        }

        setCronograma(data as Cronograma)

        // Buscar informações do curso e disciplinas
        if (data.curso_alvo_id) {
          const { data: cursoData } = await supabase
            .from('cursos')
            .select('id, nome')
            .eq('id', data.curso_alvo_id)
            .single()
          
          if (cursoData) {
            setCurso(cursoData)
          }
        }

        if (data.disciplinas_selecionadas && data.disciplinas_selecionadas.length > 0) {
          const { data: disciplinasData } = await supabase
            .from('disciplinas')
            .select('id, nome')
            .in('id', data.disciplinas_selecionadas)
            .order('nome', { ascending: true })
          
          if (disciplinasData) {
            setDisciplinas(disciplinasData)
          }
        }
      } catch (err) {
        console.error('Erro inesperado ao carregar cronograma:', {
          error: err,
          errorString: String(err),
          errorJSON: JSON.stringify(err, Object.getOwnPropertyNames(err)),
          cronogramaId,
        })
      } finally {
        setLoading(false)
      }
    }

    loadCronograma()
  }, [cronogramaId])

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
        const { data: upsertData, error: aulaError } = await supabase
          .from('aulas_concluidas')
          .upsert(
            {
              aluno_id: alunoAtual,
              aula_id: itemAlvo.aula_id,
              curso_id: cursoDaAula,
            },
            { onConflict: 'aluno_id,aula_id' },
          )
        if (aulaError) {
          console.error('Erro ao registrar aula concluída:', {
            message: aulaError.message,
            details: aulaError.details,
            hint: aulaError.hint,
            code: aulaError.code,
            aluno_id: alunoAtual,
            aula_id: itemAlvo.aula_id,
            curso_id: cursoDaAula,
          })
        } else {
          console.log('✓ Aula concluída registrada com sucesso:', {
            aluno_id: alunoAtual,
            aula_id: itemAlvo.aula_id,
            curso_id: cursoDaAula,
          })
        }
      } else {
        const { error: deleteError } = await supabase
          .from('aulas_concluidas')
          .delete()
          .eq('aluno_id', alunoAtual)
          .eq('aula_id', itemAlvo.aula_id)
        if (deleteError) {
          console.error('Erro ao remover aula concluída:', {
            message: deleteError.message,
            details: deleteError.details,
            hint: deleteError.hint,
            code: deleteError.code,
            aluno_id: alunoAtual,
            aula_id: itemAlvo.aula_id,
          })
        } else {
          console.log('✓ Aula concluída removida com sucesso:', {
            aluno_id: alunoAtual,
            aula_id: itemAlvo.aula_id,
          })
        }
      }
    } else {
      console.warn('⚠️ Não foi possível registrar aula concluída - dados faltando:', {
        temAulaId: !!itemAlvo?.aula_id,
        temAlunoAtual: !!alunoAtual,
        temCursoDaAula: !!cursoDaAula,
        aulaId: itemAlvo?.aula_id,
        alunoAtual,
        cursoDaAula,
      })
    }

    // Atualizar estado local
    if (cronograma) {
      const updatedItems = cronograma.cronograma_itens.map((item) =>
        item.id === itemId
          ? { ...item, concluido, data_conclusao: updateData.data_conclusao }
          : item
      )
      setCronograma({ ...cronograma, cronograma_itens: updatedItems })
    }
  }

  const handleDeleteCronograma = async () => {
    if (!cronogramaId) return

    setDeleting(true)
    try {
      const supabase = createClient()

      // Deletar o cronograma (os itens serão deletados automaticamente por CASCADE)
      const { error } = await supabase
        .from('cronogramas')
        .delete()
        .eq('id', cronogramaId)

      if (error) {
        console.error('Erro ao deletar cronograma:', error)
        alert('Erro ao deletar cronograma. Tente novamente.')
        setDeleting(false)
        return
      }

      // Redirecionar para a página de criação de novo cronograma
      router.push('/aluno/cronograma/novo')
    } catch (err) {
      console.error('Erro inesperado ao deletar cronograma:', err)
      alert('Erro ao deletar cronograma. Tente novamente.')
      setDeleting(false)
    }
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
          <CardContent>
            <Button onClick={() => router.push('/aluno/cronograma/novo')}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Novo Cronograma
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalItens = cronograma.cronograma_itens.length
  const itensConcluidos = cronograma.cronograma_itens.filter((item) => item.concluido).length
  const progressoPercentual = totalItens > 0 ? (itensConcluidos / totalItens) * 100 : 0

  // Função para calcular semanas disponibilizadas (período entre data início e fim, descontando férias)
  const calcularSemanasDisponibilizadas = (
    dataInicio: string,
    dataFim: string,
    ferias: Array<{ inicio: string; fim: string }>,
  ): number => {
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim)
    let semanas = 0
    let dataAtual = new Date(inicio)

    while (dataAtual <= fim) {
      const fimSemana = addDays(dataAtual, 6) // 7 dias (0-6)

      // Verificar se a semana cai em período de férias
      let isFerias = false
      for (const periodo of ferias || []) {
        if (!periodo.inicio || !periodo.fim) continue
        
        const inicioFerias = new Date(periodo.inicio)
        const fimFerias = new Date(periodo.fim)
        
        // Validar se as datas são válidas
        if (isNaN(inicioFerias.getTime()) || isNaN(fimFerias.getTime())) {
          continue
        }
        
        if (
          (dataAtual >= inicioFerias && dataAtual <= fimFerias) ||
          (fimSemana >= inicioFerias && fimSemana <= fimFerias) ||
          (dataAtual <= inicioFerias && fimSemana >= fimFerias)
        ) {
          isFerias = true
          break
        }
      }

      if (!isFerias) {
        semanas++
      }

      dataAtual = addDays(dataAtual, 7)
    }

    return semanas
  }

  // Calcular semanas com aulas (semanas que têm pelo menos um item)
  const semanasComAulas = new Set(cronograma.cronograma_itens.map(item => item.semana_numero)).size

  // Calcular semana atual
  const hoje = new Date()
  const dataInicioCalc = new Date(cronograma.data_inicio)
  const diffTime = hoje.getTime() - dataInicioCalc.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const semanaAtual = Math.floor(diffDays / 7) + 1

  // Calcular todas as semanas do cronograma (incluindo férias)
  const dataInicio = new Date(cronograma.data_inicio)
  const dataFim = new Date(cronograma.data_fim)
  const todasSemanas: number[] = []
  let semanaNumero = 1
  let dataAtual = new Date(dataInicio)
  
  while (dataAtual <= dataFim) {
    todasSemanas.push(semanaNumero)
    dataAtual.setDate(dataAtual.getDate() + 7)
    semanaNumero = semanaNumero + 1
  }

  // Agrupar itens por semana
  const itensPorSemana = cronograma.cronograma_itens.reduce((acc, item) => {
    if (!acc[item.semana_numero]) {
      acc[item.semana_numero] = []
    }
    acc[item.semana_numero].push(item)
    return acc
  }, {} as Record<number, CronogramaItem[]>)

  // Garantir que todas as semanas tenham uma entrada (mesmo que vazia)
  // Isso é importante para exibir todas as semanas do período, mesmo sem aulas
  todasSemanas.forEach((semana) => {
    if (!itensPorSemana[semana]) {
      itensPorSemana[semana] = []
    }
  })

  // Ordenar itens dentro de cada semana
  Object.keys(itensPorSemana).forEach((semana) => {
    itensPorSemana[Number(semana)].sort((a, b) => a.ordem_na_semana - b.ordem_na_semana)
  })

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-2 md:px-4">
      {/* Header com Resumo */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg md:text-xl">{cronograma.nome || 'Meu Cronograma'}</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Semana {semanaAtual} de {Object.keys(itensPorSemana).length} |{' '}
                {format(new Date(cronograma.data_inicio), "dd 'de' MMMM", { locale: ptBR })} -{' '}
                {format(new Date(cronograma.data_fim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Criar Novo Cronograma</span>
                    <span className="sm:hidden">Novo</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Criar Novo Cronograma?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ao criar um novo cronograma, o cronograma atual será <strong>permanentemente excluído</strong> e não poderá ser recuperado.
                      <br />
                      <br />
                      Tem certeza que deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setShowDeleteDialog(false)
                        router.push('/aluno/cronograma/novo')
                      }}
                    >
                      Sim, criar novo cronograma
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={async () => {
                  try {
                    const supabase = createClient()
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session?.access_token) {
                      alert('Sessão expirada. Faça login novamente.')
                      return
                    }
                    const res = await fetch(`/api/cronograma/${cronogramaId}/export/pdf`, {
                      headers: { Authorization: `Bearer ${session.access_token}` },
                    })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({ error: 'Erro ao exportar PDF' }))
                      alert(err.error || 'Erro ao exportar PDF')
                      return
                    }
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `cronograma_${cronogramaId}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    URL.revokeObjectURL(url)
                  } catch (e) {
                    console.error('Erro ao exportar PDF:', e)
                    alert('Erro ao exportar PDF')
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Exportar PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={async () => {
                  try {
                    const supabase = createClient()
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session?.access_token) {
                      alert('Sessão expirada. Faça login novamente.')
                      return
                    }
                    const res = await fetch(`/api/cronograma/${cronogramaId}/export/xlsx`, {
                      headers: { Authorization: `Bearer ${session.access_token}` },
                    })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({ error: 'Erro ao exportar XLSX' }))
                      alert(err.error || 'Erro ao exportar XLSX')
                      return
                    }
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `cronograma_${cronogramaId}.xlsx`
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    URL.revokeObjectURL(url)
                  } catch (e) {
                    console.error('Erro ao exportar XLSX:', e)
                    alert('Erro ao exportar XLSX')
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Exportar XLSX</span>
                <span className="sm:hidden">XLSX</span>
              </Button>
              <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full sm:w-auto"
                    disabled={deleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Deletar Cronograma</span>
                    <span className="sm:hidden">Deletar</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deletar Cronograma?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O cronograma e todos os seus dados serão <strong>permanentemente excluídos</strong>, incluindo:
                      <br />
                      <br />
                      • Todas as aulas agendadas no cronograma
                      <br />
                      • Progresso e marcações de conclusão específicas deste cronograma
                      <br />
                      • Configurações e distribuição das aulas
                      <br />
                      <br />
                      <strong>Importante:</strong> O <strong>histórico de aulas concluídas</strong> será <strong>preservado</strong>. Essas marcações são independentes do cronograma e não serão deletadas. Quando você criar um novo cronograma, poderá escolher excluir automaticamente as aulas já concluídas.
                      <br />
                      <br />
                      Tem certeza que deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteCronograma}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? 'Deletando...' : 'Sim, deletar cronograma'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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

      {/* Card de Resumo das Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Configuração</CardTitle>
          <Separator className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Período:</span>
            <span>
              {format(new Date(cronograma.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - {' '}
              {format(new Date(cronograma.data_fim), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dias por semana:</span>
            <span>{cronograma.dias_estudo_semana}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Horas por dia:</span>
            <span>{cronograma.horas_estudo_dia}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total de semanas disponibilizadas:</span>
            <span>
              {calcularSemanasDisponibilizadas(
                cronograma.data_inicio,
                cronograma.data_fim,
                cronograma.periodos_ferias || []
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total de semanas do cronograma:</span>
            <span>{semanasComAulas}</span>
          </div>
          <Separator />
          {curso && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Curso:</span>
                <span className="font-medium">{curso.nome}</span>
              </div>
              <Separator />
            </>
          )}
          {disciplinas.length > 0 && (
            <>
              {disciplinas.map((disciplina) => {
                // Calcular horas totais da disciplina baseado nos itens do cronograma
                let horasTotais = 0
                if (cronograma?.cronograma_itens) {
                  cronograma.cronograma_itens.forEach((item) => {
                    const disciplinaId = item.aulas?.modulos?.frentes?.disciplinas?.id
                    if (disciplinaId === disciplina.id && item.aulas?.tempo_estimado_minutos) {
                      horasTotais += item.aulas.tempo_estimado_minutos
                    }
                  })
                }
                return (
                  <div key={disciplina.id} className="flex justify-between">
                    <span className="text-muted-foreground">{disciplina.nome}:</span>
                    <span>{horasTotais > 0 ? formatHorasFromMinutes(horasTotais) : '--'}</span>
                  </div>
                )
              })}
            </>
          )}
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modalidade:</span>
            <span>
              {{
                1: 'Super Extensivo',
                2: 'Extensivo',
                3: 'Semi Extensivo',
                4: 'Intensivo',
                5: 'Superintensivo',
              }[cronograma.prioridade_minima || 2] || 'Não definida'}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tipo de Estudo:</span>
            <span className="capitalize">
              {cronograma.modalidade_estudo === 'paralelo' ? 'Frentes em Paralelo' : 'Estudo Sequencial'}
            </span>
          </div>
          <Separator />
          {cronograma.velocidade_reproducao && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Velocidade de Reprodução:</span>
              <span>{cronograma.velocidade_reproducao.toFixed(2)}x</span>
            </div>
          )}
          {cronograma.periodos_ferias && cronograma.periodos_ferias.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="text-muted-foreground">Pausas e Recessos:</span>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                {cronograma.periodos_ferias.map((periodo, index) => (
                  <li key={index}>
                    {formatDateSafe(periodo.inicio)} - {formatDateSafe(periodo.fim)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Itens */}
      <ScheduleList
        itensPorSemana={itensPorSemana}
        dataInicio={cronograma.data_inicio}
        dataFim={cronograma.data_fim}
        periodosFerias={cronograma.periodos_ferias || []}
        modalidade={cronograma.modalidade_estudo}
        cronogramaId={cronogramaId}
        onToggleConcluido={toggleConcluido}
        onUpdate={(updater) => {
          if (cronograma) {
            setCronograma(updater(cronograma))
          }
        }}
      />
    </div>
  )
}

