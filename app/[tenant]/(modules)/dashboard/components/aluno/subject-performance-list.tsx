'use client'

import { useEffect, useMemo, useState } from 'react'
import type { DashboardGroupBy, DashboardPeriod, DashboardScopeLevel, PerformanceItem, SubjectPerformance } from '../../types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/forms/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/shared/components/overlay/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/app/shared/library/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { fetchDashboardCourses, fetchPerformance, type DashboardCourse } from '../../services/dashboard.service'
import { OrganizationBadge } from '@/app/[tenant]/(modules)/dashboard/components/organization-switcher'
import { useStudentOrganizations } from '@/components/providers/student-organizations-provider'
import { useTenantContext } from '@/app/[tenant]/tenant-context'

interface SubjectPerformanceListProps {
  subjects: SubjectPerformance[] // usado como fallback inicial
  period?: DashboardPeriod
}

type SortOption = 'worst-best' | 'best-worst' | 'alphabetical'

export function SubjectPerformanceList({
  subjects,
  period = 'anual',
}: SubjectPerformanceListProps) {
  const [sortOption, setSortOption] = useState<SortOption>('worst-best')
  const [groupBy, setGroupBy] = useState<DashboardGroupBy>('frente')
  const { isMultiOrg, activeOrganization } = useStudentOrganizations()
  const { empresaId: tenantEmpresaId } = useTenantContext()
  const effectiveEmpresaId = tenantEmpresaId ?? activeOrganization?.id

  const [courses, setCourses] = useState<DashboardCourse[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null)
  const [selectedFrontId, setSelectedFrontId] = useState<string | null>(null)

  const [disciplineOptions, setDisciplineOptions] = useState<PerformanceItem[]>([])
  const [frontOptions, setFrontOptions] = useState<PerformanceItem[]>([])

  const [items, setItems] = useState<PerformanceItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const scopeParams = useMemo((): { scope: DashboardScopeLevel; scopeId?: string } => {
    if (groupBy === 'curso') return { scope: 'curso' }
    if (groupBy === 'disciplina') return { scope: 'curso', scopeId: selectedCourseId ?? undefined }
    if (groupBy === 'frente') return { scope: 'disciplina', scopeId: selectedDisciplineId ?? undefined }
    return { scope: 'frente', scopeId: selectedFrontId ?? undefined } // modulo
  }, [groupBy, selectedCourseId, selectedDisciplineId, selectedFrontId])

  // Map of courseId -> organization data for showing badges when groupBy=curso
  const courseOrgMap = useMemo(() => {
    const map = new Map<string, { nome: string; logoUrl: string | null }>()
    for (const c of courses) {
      if (c.empresa_id && c.empresaNome) {
        map.set(c.id, { nome: c.empresaNome, logoUrl: c.empresaLogoUrl })
      }
    }
    return map
  }, [courses])

  // Check if there are multiple organizations in the courses (for showing badges)
  const hasMultipleOrgs = useMemo(() => {
    const orgIds = new Set(courses.map((c) => c.empresa_id).filter(Boolean))
    return orgIds.size > 1
  }, [courses])

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
        const res = await fetchPerformance({ groupBy: 'disciplina', scope: 'curso', scopeId: selectedCourseId ?? undefined, period, empresaId: effectiveEmpresaId })
        if (cancelled) return
        setDisciplineOptions(res)
        const first = res.find((i) => i.id && i.id !== '__unknown__')?.id ?? null
        setSelectedDisciplineId(first)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    ensureDiscipline()
    return () => {
      cancelled = true
    }
  }, [groupBy, selectedDisciplineId, selectedCourseId, period, effectiveEmpresaId])

  // Garantir frente selecionada quando necessário (groupBy=modulo)
  useEffect(() => {
    let cancelled = false
    async function ensureFront() {
      if (groupBy !== 'modulo') return
      if (!selectedDisciplineId) return
      if (selectedFrontId) return
      setIsLoading(true)
      try {
        const res = await fetchPerformance({ groupBy: 'frente', scope: 'disciplina', scopeId: selectedDisciplineId, period, empresaId: effectiveEmpresaId })
        if (cancelled) return
        setFrontOptions(res)
        const first = res.find((i) => i.id && i.id !== '__unknown__')?.id ?? null
        setSelectedFrontId(first)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    ensureFront()
    return () => {
      cancelled = true
    }
  }, [groupBy, selectedDisciplineId, selectedFrontId, period, effectiveEmpresaId])

  // Carregar dados do card
  useEffect(() => {
    let cancelled = false
    async function load() {
      if ((groupBy === 'frente' && !scopeParams.scopeId) || (groupBy === 'modulo' && !scopeParams.scopeId)) {
        return
      }
      setIsLoading(true)
      try {
        const res = await fetchPerformance({ groupBy, scope: scopeParams.scope, scopeId: scopeParams.scopeId, period, empresaId: effectiveEmpresaId })
        if (cancelled) return
        setItems(res)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [groupBy, scopeParams.scope, scopeParams.scopeId, period, effectiveEmpresaId])

  // Função para ordenar os dados
  const renderItems: PerformanceItem[] = items ?? subjects.map((s) => ({
    id: String(s.id),
    name: s.name,
    subLabel: s.front,
    score: s.score,
    isNotStarted: !!s.isNotStarted,
  }))

  const sortedSubjects = [...renderItems].sort((a, b) => {
    switch (sortOption) {
      case 'worst-best':
        return a.score - b.score
      case 'best-worst':
        return b.score - a.score
      case 'alphabetical':
        return `${a.name} (${a.subLabel ?? ''})`.localeCompare(`${b.name} (${b.subLabel ?? ''})`)
      default:
        return 0
    }
  })

  // Função para determinar a cor da barra baseada no score
  const getBarColor = (score: number) => {
    if (score >= 80) {
      return 'bg-green-500'
    }
    if (score >= 50) {
      return 'bg-yellow-500'
    }
    return 'bg-red-500'
  }

  const importanciaLabel = (v?: PerformanceItem['importancia']) => {
    if (!v) return null
    // garantir capitalização consistente
    if (v === 'Base') return 'Base'
    if (v === 'Alta') return 'Alta'
    if (v === 'Media') return 'Média'
    if (v === 'Baixa') return 'Baixa'
    return String(v)
  }

  return (
    <Card className="h-full overflow-hidden transition-all duration-300">
      <CardContent className="px-4 md:px-6 py-3 md:py-4 h-full flex flex-col min-h-0">
        <div className="flex flex-col gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <h2 className="widget-title">
              Performance por {groupBy === 'curso' ? 'Curso' : groupBy === 'disciplina' ? 'Disciplina' : groupBy === 'frente' ? 'Frente' : 'Módulo'}
            </h2>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label="Informações sobre as classificações de performance"
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
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Classificações:</p>
                    <ul className="space-y-1.5 text-xs">
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                        <span>≥ 80%: Excelente</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
                        <span>≥ 50%: Regular</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                        <span>&lt; 50%: Precisa melhorar</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                        <span>Não iniciada: Sem atividades concluídas</span>
                      </li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Controles (ocupam o card inteiro como no Domínio Estratégico) */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-2 items-center mb-4 md:mb-6">
          <ToggleGroup
            type="single"
            value={groupBy}
            onValueChange={(v) => {
              if (!v) return
              setGroupBy(v as DashboardGroupBy)
            }}
            variant="segmented"
            size="sm"
            className="w-full"
          >
            <ToggleGroupItem value="curso" variant="segmented" size="sm">Curso</ToggleGroupItem>
            <ToggleGroupItem value="disciplina" variant="segmented" size="sm">Disciplina</ToggleGroupItem>
            <ToggleGroupItem value="frente" variant="segmented" size="sm">Frente</ToggleGroupItem>
            <ToggleGroupItem value="modulo" variant="segmented" size="sm">Módulo</ToggleGroupItem>
          </ToggleGroup>

          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="worst-best">Pior para Melhor</SelectItem>
              <SelectItem value="best-worst">Melhor para Pior</SelectItem>
              <SelectItem value="alphabetical">Ordem Alfabética</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-2">
          {groupBy !== 'curso' && courses.length > 1 && (
            <Select value={selectedCourseId ?? ''} onValueChange={(v) => setSelectedCourseId(v || null)}>
              <SelectTrigger size="sm" className="w-full sm:w-55">
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
            <Select value={selectedDisciplineId ?? ''} onValueChange={(v) => setSelectedDisciplineId(v || null)}>
              <SelectTrigger size="sm" className="w-full sm:w-55">
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                {disciplineOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {groupBy === 'modulo' && (
            <Select value={selectedFrontId ?? ''} onValueChange={(v) => setSelectedFrontId(v || null)}>
              <SelectTrigger size="sm" className="w-full sm:w-55">
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
          <p className="text-xs text-muted-foreground mb-2">Atualizando…</p>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {sortedSubjects.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Sem dados suficientes para calcular performance.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:gap-y-6">
              {sortedSubjects.map((subject) => (
                <div key={subject.id} className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {groupBy === 'modulo' ? (
                        <span className="inline-flex items-center gap-2 flex-wrap">
                          <span>
                            {subject.moduloNumero != null
                              ? `Módulo ${subject.moduloNumero} (${subject.name})`
                              : subject.name}
                          </span>
                          {importanciaLabel(subject.importancia) && (
                            <Badge
                              variant="outline"
                              className="text-[11px] px-2 py-0.5 border-border bg-muted text-muted-foreground"
                            >
                              {importanciaLabel(subject.importancia)}
                            </Badge>
                          )}
                        </span>
                      ) : groupBy === 'curso' ? (
                        <span className="inline-flex items-center gap-2 flex-wrap">
                          <span>{subject.name}</span>
                          {/* Show organization badge for multi-org students viewing all orgs */}
                          {isMultiOrg && hasMultipleOrgs && !activeOrganization && courseOrgMap.has(subject.id) && (
                            <OrganizationBadge
                              organization={{
                                nome: courseOrgMap.get(subject.id)!.nome,
                                logoUrl: courseOrgMap.get(subject.id)!.logoUrl,
                              }}
                            />
                          )}
                        </span>
                      ) : (
                        subject.name
                      )}
                      {groupBy !== 'modulo' && groupBy !== 'curso' && subject.subLabel ? (
                        <span className="text-muted-foreground font-normal"> ({subject.subLabel})</span>
                      ) : null}
                    </span>
                    <span className="font-medium text-muted-foreground">
                      {subject.isNotStarted ? (
                        <span className="text-muted-foreground italic">
                          Não iniciada
                        </span>
                      ) : (
                        `${subject.score}%`
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    {subject.isNotStarted ? (
                      <div className="h-2.5 rounded-full bg-muted-foreground/25" />
                    ) : (
                      <div
                        className={cn(
                          'h-2.5 rounded-full transition-all',
                          getBarColor(subject.score)
                        )}
                        style={{ width: `${subject.score}%` }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
