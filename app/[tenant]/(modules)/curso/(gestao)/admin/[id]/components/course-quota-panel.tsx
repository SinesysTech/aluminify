'use client'

import * as React from 'react'
import { Input } from '@/app/shared/components/forms/input'
import { Button } from '@/components/ui/button'
import { Loader2, CalendarCheck, Check } from 'lucide-react'
import { apiClient } from '@/shared/library/api-client'

interface QuotaResponse {
  success: boolean
  quotaMensal: number
  empresaId: string | null
}

interface CourseQuotaPanelProps {
  courseId: string
}

export function CourseQuotaPanel({ courseId }: CourseQuotaPanelProps) {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [quota, setQuota] = React.useState(0)
  const [originalQuota, setOriginalQuota] = React.useState(0)
  const [empresaId, setEmpresaId] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await apiClient.get<QuotaResponse>(
          `/api/curso/${courseId}/plantao-quota`
        )
        if (response) {
          setQuota(response.quotaMensal ?? 0)
          setOriginalQuota(response.quotaMensal ?? 0)
          setEmpresaId(response.empresaId || '')
        }
      } catch (err) {
        console.error('Error loading plantao quota:', err)
        setError('Erro ao carregar cota')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [courseId])

  const hasChanges = quota !== originalQuota

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await apiClient.post(`/api/curso/${courseId}/plantao-quota`, {
        quotaMensal: quota,
        empresaId,
      })
      setOriginalQuota(quota)
      setSuccess(true)
    } catch (err) {
      console.error('Error saving plantao quota:', err)
      setError('Erro ao salvar cota')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/80 shadow-sm p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando cota...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/80 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold">Cota de Plantões</h3>
            <p className="text-sm text-muted-foreground">
              Quantidade de plantões que cada aluno deste curso pode agendar por mês.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-32">
            <Input
              type="number"
              min={0}
              value={quota}
              onChange={(e) => {
                setSuccess(false)
                setError(null)
                setQuota(Math.max(0, parseInt(e.target.value) || 0))
              }}
            />
          </div>
          <span className="text-sm text-muted-foreground">plantões/mês por aluno</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Valor 0 = sem direito a plantões. A cota é renovada automaticamente a cada mês.
        </p>
      </div>

      {/* Footer */}
      {(hasChanges || error || success) && (
        <div className="p-4 border-t border-border/40 flex items-center justify-between gap-4">
          <div className="flex-1">
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                Cota salva com sucesso!
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
