'use client'

import * as React from 'react'
import { Input } from '@/app/shared/components/forms/input'
import { Button } from '@/components/ui/button'
import { Loader2, Check, CalendarCheck, Search } from 'lucide-react'
import { apiClient } from '@/shared/library/api-client'

interface Course {
  id: string
  name: string
  modality: string
  type: string
  year: number
}

interface CourseWithQuota extends Course {
  empresaId: string
  quota: number
  originalQuota: number
  saving: boolean
  success: boolean
  error: string | null
}

export function CotasTable() {
  const [courses, setCourses] = React.useState<CourseWithQuota[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await apiClient.get<{ data: Course[] }>('/api/curso')
        const coursesData = Array.isArray(response) ? response : response?.data
        if (!Array.isArray(coursesData)) return

        const withQuotas = await Promise.all(
          coursesData.map(async (course) => {
            try {
              const quotaData = await apiClient.get<{ quotaMensal: number; empresaId: string }>(
                `/api/curso/${course.id}/plantao-quota`
              )
              return {
                ...course,
                empresaId: quotaData?.empresaId ?? '',
                quota: quotaData?.quotaMensal ?? 0,
                originalQuota: quotaData?.quotaMensal ?? 0,
                saving: false,
                success: false,
                error: null,
              }
            } catch {
              return {
                ...course,
                empresaId: '',
                quota: 0,
                originalQuota: 0,
                saving: false,
                success: false,
                error: null,
              }
            }
          })
        )

        setCourses(withQuotas)
      } catch (err) {
        console.error('Error fetching courses:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const updateQuota = (courseId: string, value: number) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? { ...c, quota: Math.max(0, value), success: false, error: null }
          : c
      )
    )
  }

  const saveQuota = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    if (!course) return

    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, saving: true, error: null, success: false } : c
      )
    )

    try {
      await apiClient.post(`/api/curso/${courseId}/plantao-quota`, {
        quotaMensal: course.quota,
        empresaId: course.empresaId,
      })

      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, originalQuota: course.quota, saving: false, success: true }
            : c
        )
      )
    } catch {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, saving: false, error: 'Erro ao salvar' }
            : c
        )
      )
    }
  }

  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando cursos...</span>
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <CalendarCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Nenhum curso encontrado.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar curso..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.map((course) => (
          <div
            key={course.id}
            className="rounded-lg border bg-card p-4 flex flex-col gap-3"
          >
            <div>
              <p className="font-medium text-sm">{course.name}</p>
              <p className="text-xs text-muted-foreground">
                {course.modality} &middot; {course.type} &middot; {course.year}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24">
                <Input
                  type="number"
                  min={0}
                  value={course.quota}
                  onChange={(e) =>
                    updateQuota(course.id, parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <span className="text-xs text-muted-foreground">/mês por aluno</span>
              {course.quota !== course.originalQuota && (
                <Button
                  size="sm"
                  onClick={() => saveQuota(course.id)}
                  disabled={course.saving}
                >
                  {course.saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Salvar'
                  )}
                </Button>
              )}
              {course.success && (
                <Check className="h-4 w-4 text-green-600" />
              )}
              {course.error && (
                <span className="text-xs text-destructive">{course.error}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="p-4 font-medium">Curso</th>
              <th className="p-4 font-medium">Modalidade</th>
              <th className="p-4 font-medium">Tipo</th>
              <th className="p-4 font-medium">Ano</th>
              <th className="p-4 font-medium">Cota mensal</th>
              <th className="p-4 font-medium w-32"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((course) => (
              <tr key={course.id} className="border-b last:border-0">
                <td className="p-4 text-sm font-medium">{course.name}</td>
                <td className="p-4 text-sm text-muted-foreground">
                  {course.modality}
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {course.type}
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {course.year}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <Input
                        type="number"
                        min={0}
                        value={course.quota}
                        onChange={(e) =>
                          updateQuota(
                            course.id,
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">/mês</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {course.quota !== course.originalQuota && (
                      <Button
                        size="sm"
                        onClick={() => saveQuota(course.id)}
                        disabled={course.saving}
                      >
                        {course.saving && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        )}
                        Salvar
                      </Button>
                    )}
                    {course.success && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    {course.error && (
                      <span className="text-xs text-destructive">
                        {course.error}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Valor 0 = nenhum atendimento permitido. A cota é renovada automaticamente a cada mês.
      </p>
    </div>
  )
}
