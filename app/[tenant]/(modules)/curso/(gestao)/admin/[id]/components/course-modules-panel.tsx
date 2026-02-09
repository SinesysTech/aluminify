'use client'

import * as React from 'react'
import { Switch } from '@/app/shared/components/forms/switch'
import { Button } from '@/components/ui/button'
import { Loader2, LayoutGrid, Eye, EyeOff, Check } from 'lucide-react'
import { apiClient } from '@/shared/library/api-client'

interface TenantModule {
  id: string
  name: string
  isCore: boolean
}

interface ModulosFullResponse {
  success: boolean
  moduleIds: string[]
  tenantModules: TenantModule[]
  empresaId: string
}

interface CourseModulesPanelProps {
  courseId: string
}

export function CourseModulesPanel({ courseId }: CourseModulesPanelProps) {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [tenantModules, setTenantModules] = React.useState<TenantModule[]>([])
  const [enabledIds, setEnabledIds] = React.useState<Set<string>>(new Set())
  const [originalIds, setOriginalIds] = React.useState<Set<string>>(new Set())
  const [empresaId, setEmpresaId] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await apiClient.get<ModulosFullResponse>(
          `/api/curso/${courseId}/modulos?full=true`
        )
        if (response) {
          setTenantModules(response.tenantModules || [])
          const ids = new Set(response.moduleIds || [])
          setEnabledIds(ids)
          setOriginalIds(new Set(ids))
          setEmpresaId(response.empresaId || '')
        }
      } catch (err) {
        console.error('Error loading course modules:', err)
        setError('Erro ao carregar módulos')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [courseId])

  const hasChanges = React.useMemo(() => {
    if (enabledIds.size !== originalIds.size) return true
    for (const id of enabledIds) {
      if (!originalIds.has(id)) return true
    }
    return false
  }, [enabledIds, originalIds])

  const toggleModule = (moduleId: string) => {
    setSuccess(false)
    setError(null)
    const newSet = new Set(enabledIds)
    if (newSet.has(moduleId)) {
      newSet.delete(moduleId)
    } else {
      newSet.add(moduleId)
    }
    setEnabledIds(newSet)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await apiClient.post(`/api/curso/${courseId}/modulos`, {
        moduleIds: Array.from(enabledIds),
        empresaId,
      })
      setOriginalIds(new Set(enabledIds))
      setSuccess(true)
    } catch (err) {
      console.error('Error saving course modules:', err)
      setError('Erro ao salvar módulos')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/80 shadow-sm p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando módulos...</span>
        </div>
      </div>
    )
  }

  const toggleableModules = tenantModules.filter(m => !m.isCore)
  const coreModules = tenantModules.filter(m => m.isCore)

  return (
    <div className="rounded-xl border border-border/40 bg-card/80 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold">Módulos do Curso</h3>
            <p className="text-sm text-muted-foreground">
              Defina quais módulos os alunos deste curso terão acesso.
            </p>
          </div>
        </div>
      </div>

      {/* Module List */}
      <div className="divide-y divide-border">
        {toggleableModules.map((module) => (
          <div key={module.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {enabledIds.has(module.id) ? (
                <Eye className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm font-medium">{module.name}</span>
            </div>
            <Switch
              checked={enabledIds.has(module.id)}
              onCheckedChange={() => toggleModule(module.id)}
            />
          </div>
        ))}
        {coreModules.map((module) => (
          <div key={module.id} className="flex items-center justify-between px-4 py-3 opacity-60">
            <div className="flex items-center gap-3">
              <Eye className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium">{module.name}</span>
              <span className="text-xs text-muted-foreground">(sempre ativo)</span>
            </div>
            <Switch checked disabled />
          </div>
        ))}
      </div>

      {/* Footer */}
      {(hasChanges || error || success) && (
        <div className="p-4 border-t border-border/40 flex items-center justify-between gap-4">
          <div className="flex-1">
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                Módulos salvos com sucesso!
              </p>
            )}
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
