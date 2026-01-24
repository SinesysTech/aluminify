'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SubjectDistributionItem } from '@/types/dashboard'
import type { DashboardGroupBy, DashboardPeriod, DashboardScopeLevel, PerformanceItem, SubjectDistributionExtendedItem } from '@/types/dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { fetchDashboardCourses, fetchPerformance, fetchSubjectDistribution } from '@/lib/services/dashboardService'

interface SubjectDistributionProps {
  data: SubjectDistributionItem[]
  totalHours?: number // Total de horas para exibir no centro (fallback)
  period?: DashboardPeriod
}

export function SubjectDistribution({
  data,
  totalHours = 42,
  period = 'anual',
}: SubjectDistributionProps) {
  const [groupBy, setGroupBy] = useState<DashboardGroupBy>('disciplina')

  const [courses, setCourses] = useState<Array<{ id: string; nome: string }>>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null)
  const [selectedFrontId, setSelectedFrontId] = useState<string | null>(null)

  const [disciplineOptions, setDisciplineOptions] = useState<PerformanceItem[]>([])
  const [frontOptions, setFrontOptions] = useState<PerformanceItem[]>([])

  const [items, setItems] = useState<SubjectDistributionExtendedItem[] | null>(null)
  const [computedTotalHours, setComputedTotalHours] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const scopeParams = useMemo((): { scope: DashboardScopeLevel; scopeId?: string } => {
    if (groupBy === 'curso') return { scope: 'curso' }
    if (groupBy === 'disciplina') return { scope: 'curso', scopeId: selectedCourseId ?? undefined }
    if (groupBy === 'frente') return { scope: 'disciplina', scopeId: selectedDisciplineId ?? undefined }
    return { scope: 'frente', scopeId: selectedFrontId ?? undefined } // modulo
  }, [groupBy, selectedCourseId, selectedDisciplineId, selectedFrontId])

  // Carregar cursos (para permitir filtro por curso quando fizer sentido)
  useEffect(() => {
    let cancelled = false
    async function loadCourses() {
      try {
        const c = await fetchDashboardCourses()
        if (!cancelled) {
          setCourses(c)
          if (c.length === 1) setSelectedCourseId(c[0].id)
        }
      } catch {
        // silencioso: a UI ainda funciona sem lista de cursos
      }
    }
    loadCourses()
    return () => {
      cancelled = true
    }
  }, [])

  // Resetar seleções dependentes quando subir no nível
  useEffect(() => {
    if (groupBy === 'curso') {
      setSelectedDisciplineId(null)
      setSelectedFrontId(null)
      setDisciplineOptions([])
      setFrontOptions([])
      return
    }
    if (groupBy === 'disciplina') {
      setSelectedDisciplineId(null)
      setSelectedFrontId(null)
      setDisciplineOptions([])
      setFrontOptions([])
      return
    }
    if (groupBy === 'frente') {
      setSelectedFrontId(null)
      setFrontOptions([])
    }
  }, [groupBy])

  // Garantir disciplina selecionada quando necessário (groupBy=frente)
  useEffect(() => {
    let cancelled = false
    async function ensureDiscipline() {
      if (groupBy !== 'frente') return
      if (selectedDisciplineId) return
      setIsLoading(true)
      try {
        // Importante: opções de disciplina vêm da estrutura (performance), não do tempo (distribuição),
        // para não ficar vazio quando ainda não há sessões suficientes.
        const res = await fetchPerformance({
          groupBy: 'disciplina',
          scope: 'curso',
          scopeId: selectedCourseId ?? undefined,
        })
        if (cancelled) return
        const filtered = res.filter((i) => i.id && i.id !== '__unknown__')
        setDisciplineOptions(filtered)
        const first = filtered[0]?.id ?? null
        setSelectedDisciplineId(first)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    ensureDiscipline()
    return () => {
      cancelled = true
    }
  }, [groupBy, selectedDisciplineId, selectedCourseId, period])

  // Garantir frente selecionada quando necessário (groupBy=modulo)
  useEffect(() => {
    let cancelled = false
    async function ensureFront() {
      if (groupBy !== 'modulo') return
      if (!selectedDisciplineId) return
      if (selectedFrontId) return
      setIsLoading(true)
      try {
        // Opções de frente também vêm da estrutura (performance), para evitar dropdown vazio.
        const res = await fetchPerformance({
          groupBy: 'frente',
          scope: 'disciplina',
          scopeId: selectedDisciplineId,
        })
        if (cancelled) return
        const filtered = res.filter((i) => i.id && i.id !== '__unknown__')
        setFrontOptions(filtered)
        const first = filtered[0]?.id ?? null
        setSelectedFrontId(first)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    ensureFront()
    return () => {
      cancelled = true
    }
  }, [groupBy, selectedDisciplineId, selectedFrontId, period])

  // Carregar dados do card
  useEffect(() => {
    let cancelled = false
    async function load() {
      // Não disparar fetch enquanto faltar escopo obrigatório
      if ((groupBy === 'frente' && !scopeParams.scopeId) || (groupBy === 'modulo' && !scopeParams.scopeId)) {
        return
      }
      setIsLoading(true)
      try {
        const res = await fetchSubjectDistribution({
          groupBy,
          scope: scopeParams.scope,
          scopeId: scopeParams.scopeId,
          period,
        })
        if (cancelled) return
        setItems(res.items)
        setComputedTotalHours(res.totalHours)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [groupBy, scopeParams.scope, scopeParams.scopeId, period])

  const renderItems = items ?? data
  const centerHours = computedTotalHours ?? totalHours

  const radius = 15.91549430918954
  const circumference = 2 * Math.PI * radius

  // Pre-compute offsets to avoid mutation during render
  const itemsWithOffsets = renderItems.map((item, index) => {
    const previousItems = renderItems.slice(0, index)
    const offset = previousItems.reduce((acc, prev) => acc + (prev.percentage / 100) * circumference, 0)
    return { item, offset }
  })

  return (
    <Card className="h-full">
      <CardContent className="px-4 md:px-6 py-3 md:py-4 h-full flex flex-col min-h-0">
        <div className="flex flex-col gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-foreground text-base md:text-lg font-semibold">
              Distribuição por {groupBy === 'curso' ? 'Curso' : groupBy === 'disciplina' ? 'Disciplina' : groupBy === 'frente' ? 'Frente' : 'Módulo'}
            </h2>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label="Informações sobre distribuição por disciplina"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="start"
                  className="max-w-xs bg-slate-900 dark:bg-slate-800 text-slate-50 border-slate-700 p-3 z-50"
                  sideOffset={8}
                >
                  <div className="space-y-2 text-sm">
                    <p>
                      Este gráfico mostra como seu tempo de estudo está distribuído (aulas assistidas no cronograma + tempo registrado em listas de exercícios).
                    </p>
                    <p>
                      Cada cor representa um grupo (curso, disciplina, frente ou módulo) e o tamanho do segmento indica a porcentagem do tempo total.
                    </p>
                    <p>
                      O número no centro mostra o total de horas estudadas.
                    </p>
                    <p>
                      Uma distribuição equilibrada ajuda a manter un bom desempenho em todas as áreas.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <ToggleGroup
          type="single"
          value={groupBy}
          onValueChange={(v) => {
            if (!v) return
            setGroupBy(v as DashboardGroupBy)
          }}
          variant="segmented"
          size="sm"
          className="w-full mb-4 md:mb-6"
        >
          <ToggleGroupItem value="curso" variant="segmented" size="sm">Curso</ToggleGroupItem>
          <ToggleGroupItem value="disciplina" variant="segmented" size="sm">Disciplina</ToggleGroupItem>
          <ToggleGroupItem value="frente" variant="segmented" size="sm">Frente</ToggleGroupItem>
          <ToggleGroupItem value="modulo" variant="segmented" size="sm">Módulo</ToggleGroupItem>
        </ToggleGroup>

        {/* Filtros dependentes (mantém UI simples: só aparece quando necessário) */}
        <div className="flex flex-wrap gap-2 mb-2">
          {groupBy !== 'curso' && courses.length > 1 && (
            <Select
              value={selectedCourseId ?? ''}
              onValueChange={(v) => setSelectedCourseId(v || null)}
            >
              <SelectTrigger size="sm" className="w-[220px]">
                <SelectValue placeholder="Filtrar por curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {groupBy === 'frente' && (
            <Select
              value={selectedDisciplineId ?? ''}
              onValueChange={(v) => setSelectedDisciplineId(v || null)}
            >
              <SelectTrigger size="sm" className="w-[220px]">
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                {/* opções de disciplina são obtidas via fetch quando necessário */}
                {/** Reaproveitamos a chamada em ensureDiscipline; se ainda não há, a UI fica carregando */}
                {disciplineOptions.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {groupBy === 'modulo' && (
            <Select
              value={selectedFrontId ?? ''}
              onValueChange={(v) => setSelectedFrontId(v || null)}
            >
              <SelectTrigger size="sm" className="w-[220px]">
                <SelectValue placeholder="Frente" />
              </SelectTrigger>
              <SelectContent>
                {frontOptions.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading && (
          <p className="text-xs text-muted-foreground mb-2">Atualizando…</p>
        )}

        {renderItems.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Sem dados suficientes no período selecionado.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-1 items-center justify-center py-4">
              <div className="relative flex items-center justify-center w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  {/* Círculo de fundo */}
                  <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted"
                  />
                  {/* Segmentos do gráfico */}
                  {itemsWithOffsets.map(({ item, offset }, index) => {
                    const dashArray = `${(item.percentage / 100) * circumference} ${circumference}`

                    return (
                      <circle
                        key={index}
                        cx="18"
                        cy="18"
                        r={radius}
                        fill="none"
                        stroke={item.color}
                        strokeDasharray={dashArray}
                        strokeDashoffset={-offset}
                        strokeWidth="4"
                        transform="rotate(-90 18 18)"
                      />
                    )
                  })}
                </svg>
                {/* Texto central */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-muted-foreground text-sm">
                    Total
                  </span>
                  <span className="text-foreground text-xl font-bold">
                    {centerHours}h
                  </span>
                </div>
              </div>
            </div>
            {/* Legenda */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
              {renderItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name} - {item.percentage}%
                    {'prettyTime' in item && item.prettyTime ? ` (${item.prettyTime})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

