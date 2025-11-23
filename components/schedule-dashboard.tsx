'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { ScheduleKanban } from '@/components/schedule-kanban'
import { ScheduleList } from '@/components/schedule-list'
import { CalendarCheck, Download, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

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
  }
}

interface Cronograma {
  id: string
  nome: string
  data_inicio: string
  data_fim: string
  dias_estudo_semana: number
  horas_estudo_dia: number
  cronograma_itens: CronogramaItem[]
}

export function ScheduleDashboard({ cronogramaId }: { cronogramaId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cronograma, setCronograma] = useState<Cronograma | null>(null)

  useEffect(() => {
    async function loadCronograma() {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('cronogramas')
        .select(`
          *,
          cronograma_itens(
            id,
            aula_id,
            semana_numero,
            ordem_na_semana,
            concluido,
            data_conclusao,
            aulas(
              id,
              nome,
              numero_aula,
              tempo_estimado_minutos
            )
          )
        `)
        .eq('id', cronogramaId)
        .single()

      // Ordenar itens por semana e ordem
      if (data?.cronograma_itens) {
        data.cronograma_itens.sort((a: any, b: any) => {
          if (a.semana_numero !== b.semana_numero) {
            return a.semana_numero - b.semana_numero
          }
          return a.ordem_na_semana - b.ordem_na_semana
        })
      }

      if (error) {
        console.error('Erro ao carregar cronograma:', error)
      } else if (data) {
        setCronograma(data as Cronograma)
      }

      setLoading(false)
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

  // Calcular semana atual
  const hoje = new Date()
  const dataInicio = new Date(cronograma.data_inicio)
  const diffTime = hoje.getTime() - dataInicio.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const semanaAtual = Math.floor(diffDays / 7) + 1

  // Agrupar itens por semana
  const itensPorSemana = cronograma.cronograma_itens.reduce((acc, item) => {
    if (!acc[item.semana_numero]) {
      acc[item.semana_numero] = []
    }
    acc[item.semana_numero].push(item)
    return acc
  }, {} as Record<number, CronogramaItem[]>)

  // Ordenar itens dentro de cada semana
  Object.keys(itensPorSemana).forEach((semana) => {
    itensPorSemana[Number(semana)].sort((a, b) => a.ordem_na_semana - b.ordem_na_semana)
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header com Resumo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{cronograma.nome || 'Meu Cronograma'}</CardTitle>
              <CardDescription>
                Semana {semanaAtual} de {Object.keys(itensPorSemana).length} |{' '}
                {format(new Date(cronograma.data_inicio), "dd 'de' MMMM", { locale: ptBR })} -{' '}
                {format(new Date(cronograma.data_fim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </div>
            <Button variant="outline" disabled>
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
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

      {/* Tabs: Lista e Kanban */}
      <Tabs defaultValue="lista" className="w-full">
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="kanban">Quadro (Kanban)</TabsTrigger>
        </TabsList>
        <TabsContent value="lista" className="mt-4">
          <ScheduleList
            itensPorSemana={itensPorSemana}
            dataInicio={cronograma.data_inicio}
            onToggleConcluido={toggleConcluido}
          />
        </TabsContent>
        <TabsContent value="kanban" className="mt-4">
          <ScheduleKanban
            itensPorSemana={itensPorSemana}
            cronogramaId={cronogramaId}
            dataInicio={cronograma.data_inicio}
            onToggleConcluido={toggleConcluido}
            onUpdate={(updater) => {
              if (cronograma) {
                setCronograma(updater(cronograma))
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

