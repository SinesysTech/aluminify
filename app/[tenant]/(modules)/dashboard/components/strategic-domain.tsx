'use client'

import { useEffect, useMemo, useState } from 'react'
import type { StrategicDomain } from '../types'
import type { DashboardScopeLevel, PerformanceItem, StrategicDomainModuleItem } from '../types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/components/overlay/tooltip'
import { Info } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/shared/components/forms/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { fetchDashboardCourses, fetchPerformance, fetchStrategicDomain } from '../services/dashboard.service'
import { useTenantContext } from '@/app/[tenant]/tenant-context'
import { useStudentOrganizations } from '@/components/providers/student-organizations-provider'

interface StrategicDomainProps {
  data: StrategicDomain
}

function ScoreValue({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2"
              aria-label="O que significa sem evidência?"
            >
              Sem evidência
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" className="max-w-xs">
            Ainda não há dados suficientes para calcular este indicador (por exemplo: poucas questões/flashcards feitos neste tópico).
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  return <span className="font-bold">{score}%</span>
}

function ProgressBar({
  value,
  barClassName,
}: {
  value: number | null
  barClassName: string
}) {
  return (
    <div className="w-full bg-muted rounded-full h-3">
      <div
        className={`${barClassName} h-3 rounded-full transition-all`}
        style={{ width: `${value ?? 0}%` }}
      />
    </div>
  )
}

export function StrategicDomain({ data }: StrategicDomainProps) {
  const { empresaId: tenantEmpresaId } = useTenantContext()
  const { activeOrganization } = useStudentOrganizations()
  const effectiveEmpresaId = activeOrganization?.id ?? tenantEmpresaId

  // Domínio Estratégico não tem escopo por módulo (evita redundância com "Performance por Módulo")
  const [scope, setScope] = useState<Extract<DashboardScopeLevel, 'curso' | 'disciplina' | 'frente'>>('curso')
  const [courses, setCourses] = useState<Array<{ id: string; nome: string }>>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [disciplineOptions, setDisciplineOptions] = useState<PerformanceItem[]>([])
  const [frontOptions, setFrontOptions] = useState<PerformanceItem[]>([])

  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null)
  const [selectedFrontId, setSelectedFrontId] = useState<string | null>(null)

  const [focusedData, setFocusedData] = useState<StrategicDomain | null>(null)
  const [modulesRanking, setModulesRanking] = useState<StrategicDomainModuleItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const effectiveScopeId = useMemo(() => {
    if (scope === 'curso') return undefined
    if (scope === 'disciplina') return selectedDisciplineId ?? undefined
    return selectedFrontId ?? undefined
  }, [scope, selectedDisciplineId, selectedFrontId])

  // Carregar cursos
  useEffect(() => {
    let cancelled = false
    async function loadCourses() {
      try {
        const c = await fetchDashboardCourses(effectiveEmpresaId)
        if (!cancelled) {
          setCourses(c)
          if (c.length === 1) setSelectedCourseId(c[0].id)
        }
      } catch {
        // noop
      }
    }
    loadCourses()
    return () => {
      cancelled = true
    }
  }, [effectiveEmpresaId])

  // Resetar seleções dependentes
  useEffect(() => {
    if (scope === 'curso') {
      setSelectedDisciplineId(null)
      setSelectedFrontId(null)
      setDisciplineOptions([])
      setFrontOptions([])
      return
    }
    if (scope === 'disciplina') {
      setSelectedFrontId(null)
      setFrontOptions([])
      return
    }
  }, [scope])

  // Garantir disciplina selecionada quando necessário
  useEffect(() => {
    let cancelled = false
    async function ensureDiscipline() {
      if (scope === 'curso') return
      if (selectedDisciplineId) return
      setIsLoading(true)
      try {
        const res = await fetchPerformance({
          groupBy: 'disciplina',
          scope: 'curso',
          scopeId: selectedCourseId ?? undefined,
          empresaId: effectiveEmpresaId,
        })
        if (cancelled) return
        setDisciplineOptions(res.filter((r) => r.id !== '__unknown__'))
        const first = res.find((r) => r.id && r.id !== '__unknown__')?.id ?? null
        setSelectedDisciplineId(first)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    ensureDiscipline()
    return () => {
      cancelled = true
    }
  }, [scope, selectedDisciplineId, selectedCourseId, effectiveEmpresaId])

  // Garantir frente selecionada quando necessário (frente/modulo)
  useEffect(() => {
    let cancelled = false
    async function ensureFront() {
      if (scope !== 'frente') return
      if (!selectedDisciplineId) return
      if (selectedFrontId) return
      setIsLoading(true)
      try {
        const res = await fetchPerformance({
          groupBy: 'frente',
          scope: 'disciplina',
          scopeId: selectedDisciplineId,
          empresaId: effectiveEmpresaId,
        })
        if (cancelled) return
        setFrontOptions(res.filter((r) => r.id !== '__unknown__'))
        const first = res.find((r) => r.id && r.id !== '__unknown__')?.id ?? null
        setSelectedFrontId(first)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    ensureFront()
    return () => {
      cancelled = true
    }
  }, [scope, selectedDisciplineId, selectedFrontId, effectiveEmpresaId])

  // Carregar dados do card
  useEffect(() => {
    let cancelled = false
    async function load() {
      // Em níveis que dependem de seleção, não fetchar sem id
      if ((scope === 'disciplina' && !selectedDisciplineId) || (scope === 'frente' && !selectedFrontId)) return

      setIsLoading(true)
      try {
        const res = await fetchStrategicDomain({ scope, scopeId: effectiveScopeId, empresaId: effectiveEmpresaId })
        if (cancelled) return
        setFocusedData(res.data)
        setModulesRanking(res.modules)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [scope, effectiveScopeId, selectedDisciplineId, selectedFrontId, effectiveEmpresaId])

  const display = focusedData ?? data

  return (
    <Card>
      <CardContent className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col justify-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <h2 className="widget-title">
              Domínio Estratégico
            </h2>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label="Informações sobre domínio estratégico"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="start"
                  className="max-w-xs bg-popover text-popover-foreground border-border p-3 z-50"
                  sideOffset={8}
                >
                  <div className="space-y-2 text-sm">
                    <p>
                      Este indicador mostra seu progresso em áreas estratégicas do conteúdo.
                    </p>
                    <p>
                      Aqui, você vê separadamente:
                      <strong> Flashcards (memória)</strong> e <strong>Questões (aplicação)</strong>.
                    </p>
                    <p>
                      <strong>Módulos de Base</strong> representa conteúdos fundamentais que sustentam o restante.
                    </p>
                    <p>
                      <strong>Alta Recorrência</strong> representa tópicos que aparecem frequentemente nas provas.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="w-full">
            <ToggleGroup
              type="single"
              value={scope}
              onValueChange={(v) => {
                if (!v) return
                setScope(v as Extract<DashboardScopeLevel, 'curso' | 'disciplina' | 'frente'>)
              }}
              variant="segmented"
              size="sm"
              className="w-full"
            >
              <ToggleGroupItem value="curso" variant="segmented" size="sm">Curso</ToggleGroupItem>
              <ToggleGroupItem value="disciplina" variant="segmented" size="sm">Disciplina</ToggleGroupItem>
              <ToggleGroupItem value="frente" variant="segmented" size="sm">Frente</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-wrap gap-2">
            {scope !== 'curso' && courses.length > 1 && (
              <Select value={selectedCourseId ?? ''} onValueChange={(v) => setSelectedCourseId(v || null)}>
                <SelectTrigger size="sm" className="w-55">
                  <SelectValue placeholder="Filtrar por curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {scope !== 'curso' && (
              <Select value={selectedDisciplineId ?? ''} onValueChange={(v) => setSelectedDisciplineId(v || null)}>
                <SelectTrigger size="sm" className="w-55">
                  <SelectValue placeholder="Disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplineOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {scope === 'frente' && (
              <Select value={selectedFrontId ?? ''} onValueChange={(v) => setSelectedFrontId(v || null)}>
                <SelectTrigger size="sm" className="w-55">
                  <SelectValue placeholder="Frente" />
                </SelectTrigger>
                <SelectContent>
                  {frontOptions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isLoading && (
            <p className="text-xs text-muted-foreground">Atualizando...</p>
          )}

          <Accordion
            type="multiple"
            defaultValue={[]}
            className="w-full"
          >
            <AccordionItem value="base" className="border border-border rounded-lg shadow-sm mb-3 last:mb-0 bg-background border-b-0 px-3">
              <AccordionTrigger className="py-3">
                <div className="flex items-center gap-2">
                  <span>Módulos de Base</span>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="text-muted-foreground hover:text-foreground transition-colors rounded inline-flex"
                          aria-label="O que são módulos de base?"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-4 w-4" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-xs">
                        Conteúdos fundamentais que servem de base para entender o restante da matéria. Melhorar aqui tende a destravar evolução em vários tópicos.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Flashcards</span>
                    <span className="text-green-600 dark:text-green-500">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <ScoreValue score={display.baseModules.flashcardsScore} />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="max-w-xs">
                            Percentual de desempenho em flashcards neste grupo (indica o quão bem você está lembrando do conteúdo nas revisões).
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </div>
                  <ProgressBar value={display.baseModules.flashcardsScore} barClassName="bg-green-500" />
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Questões</span>
                    <span className="text-green-600 dark:text-green-500">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <ScoreValue score={display.baseModules.questionsScore} />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="max-w-xs">
                            Percentual de acerto em questões neste grupo (acertos ÷ questões respondidas).
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </div>
                  <ProgressBar value={display.baseModules.questionsScore} barClassName="bg-green-500/80" />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="high" className="border border-border rounded-lg shadow-sm mb-3 last:mb-0 bg-background border-b-0 px-3">
              <AccordionTrigger className="py-3">
                <div className="flex items-center gap-2">
                  <span>Alta Recorrência</span>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="text-muted-foreground hover:text-foreground transition-colors rounded inline-flex"
                          aria-label="O que significa alta recorrência?"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-4 w-4" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-xs">
                        Tópicos que caem com frequência nas provas. Dar atenção a estes conteúdos costuma aumentar o retorno do seu estudo.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Flashcards</span>
                    <span className="text-yellow-600 dark:text-yellow-500">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <ScoreValue score={display.highRecurrence.flashcardsScore} />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="max-w-xs">
                            Percentual de desempenho em flashcards nos tópicos de alta recorrência.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </div>
                  <ProgressBar value={display.highRecurrence.flashcardsScore} barClassName="bg-yellow-500" />
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Questões</span>
                    <span className="text-yellow-600 dark:text-yellow-500">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <ScoreValue score={display.highRecurrence.questionsScore} />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="max-w-xs">
                            Percentual de acerto em questões nos tópicos de alta recorrência.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </div>
                  <ProgressBar value={display.highRecurrence.questionsScore} barClassName="bg-yellow-500/80" />
                </div>
              </AccordionContent>
            </AccordionItem>

            {display.recommendations.length > 0 && (
              <AccordionItem value="recommendations" className="border border-border rounded-lg shadow-sm mb-3 last:mb-0 bg-background border-b-0 px-3">
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-2">
                    <span>Sugestões de foco</span>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="text-muted-foreground hover:text-foreground transition-colors rounded inline-flex"
                            aria-label="Como calculamos as sugestões de foco"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Info className="h-4 w-4" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="start" className="max-w-xs" sideOffset={8}>
                          As sugestões de foco priorizam tópicos com maior importância e menor desempenho recente.
                          Elas combinam seus resultados em questões (Q) e flashcards (F) para indicar onde o estudo tende a trazer mais ganho.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0">
                  <div className="space-y-2">
                    {display.recommendations.map((rec) => (
                      <div
                        key={rec.moduloId}
                        className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {rec.moduloNome}
                            </p>
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {rec.importancia}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {rec.reason}
                          </p>
                        </div>
                        <div className="shrink-0 text-right text-[11px] text-muted-foreground">
                          {rec.flashcardsScore != null && (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="block underline decoration-dotted underline-offset-2"
                                    aria-label="O que significa F?"
                                  >
                                    F: {rec.flashcardsScore}%
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" align="center" className="max-w-xs">
                                  **F** é seu desempenho em flashcards deste tópico (memória/recall nas revisões).
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {rec.questionsScore != null && (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="block underline decoration-dotted underline-offset-2"
                                    aria-label="O que significa Q?"
                                  >
                                    Q: {rec.questionsScore}%
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" align="center" className="max-w-xs">
                                  **Q** é sua taxa de acerto em questões deste tópico (acertos ÷ questões respondidas).
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {modulesRanking.length > 0 && (
              <AccordionItem value="ranking" className="border border-border rounded-lg shadow-sm mb-3 last:mb-0 bg-background border-b-0 px-3">
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-2">
                    <span>Ranking de módulos (estratégicos)</span>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="text-muted-foreground hover:text-foreground transition-colors rounded inline-flex"
                            aria-label="O que é o ranking de módulos estratégicos?"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Info className="h-4 w-4" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="max-w-xs">
                          Este ranking destaca os módulos mais importantes (Base/Alta) e mostra seus indicadores de Flashcards (F) e Questões (Q), para você identificar onde focar primeiro.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0">
                  <p className="text-xs text-muted-foreground mb-2">
                    **F** = Flashcards (memória/recall) | **Q** = Questões (acertos ÷ questões respondidas)
                  </p>
                  <div className="space-y-2">
                    {modulesRanking.slice(0, 8).map((m) => (
                      <div key={m.moduloId} className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{m.moduloNome}</p>
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {m.importancia}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="underline decoration-dotted underline-offset-2"
                                    aria-label="O que significa F?"
                                  >
                                    F: {m.flashcardsScore ?? '—'}%
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="start" className="max-w-xs">
                                  **F** é seu desempenho em flashcards neste módulo (memória/recall nas revisões).
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {' | '}
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="underline decoration-dotted underline-offset-2"
                                    aria-label="O que significa Q?"
                                  >
                                    Q: {m.questionsScore ?? '—'}%
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="start" className="max-w-xs">
                                  **Q** é sua taxa de acerto em questões neste módulo (acertos ÷ questões respondidas).
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {m.risk == null && (
                              <span className="ml-2 italic">Sem evidência</span>
                            )}
                          </div>
                        </div>
                        {/* "Risco" é usado apenas para ordenar; não renderizamos ao usuário. */}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  )
}

