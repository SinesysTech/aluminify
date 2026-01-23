'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { apiClient } from '@/lib/api-client'

const turmaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  dataInicio: z.string().optional().nullable(),
  dataFim: z.string().optional().nullable(),
  // Esses campos já têm `defaultValues` no react-hook-form; manter required evita conflito de tipos no resolver.
  acessoAposTermino: z.boolean(),
  diasAcessoExtra: z.number().min(0),
})

type TurmaFormData = z.infer<typeof turmaSchema>

export interface Turma {
  id: string
  cursoId: string
  nome: string
  dataInicio: string | null
  dataFim: string | null
  acessoAposTermino: boolean
  diasAcessoExtra: number
  ativo: boolean
  alunosCount?: number
}

interface TurmaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cursoId: string
  turma?: Turma | null
  onSuccess?: () => void
}

export function TurmaDialog({
  open,
  onOpenChange,
  cursoId,
  turma,
  onSuccess,
}: TurmaDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isEditing = !!turma

  const form = useForm<TurmaFormData>({
    resolver: zodResolver(turmaSchema),
    defaultValues: {
      nome: '',
      dataInicio: null,
      dataFim: null,
      acessoAposTermino: false,
      diasAcessoExtra: 0,
    },
  })

  // Reset form when turma changes
  React.useEffect(() => {
    if (turma) {
      form.reset({
        nome: turma.nome,
        dataInicio: turma.dataInicio,
        dataFim: turma.dataFim,
        acessoAposTermino: turma.acessoAposTermino,
        diasAcessoExtra: turma.diasAcessoExtra,
      })
    } else {
      form.reset({
        nome: '',
        dataInicio: null,
        dataFim: null,
        acessoAposTermino: false,
        diasAcessoExtra: 0,
      })
    }
  }, [turma, form])

  const onSubmit = async (data: TurmaFormData) => {
    setLoading(true)
    setError(null)

    try {
      if (isEditing && turma) {
        await apiClient.put(`/api/turma/${turma.id}`, data)
      } else {
        await apiClient.post('/api/turma', {
          ...data,
          cursoId,
        })
      }

      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (err) {
      console.error('Error saving turma:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar turma')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Turma' : 'Nova Turma'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Atualize as informações da turma.'
                : 'Preencha as informações para criar uma nova turma.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da Turma *</Label>
              <Input
                id="nome"
                placeholder="Ex: Turma A - Manhã"
                {...form.register('nome')}
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  {...form.register('dataInicio')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dataFim">Data de Término</Label>
                <Input
                  id="dataFim"
                  type="date"
                  {...form.register('dataFim')}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="acessoAposTermino">Acesso após término</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir acesso aos materiais após a data de término
                </p>
              </div>
              <Switch
                id="acessoAposTermino"
                checked={form.watch('acessoAposTermino')}
                onCheckedChange={(checked) =>
                  form.setValue('acessoAposTermino', checked)
                }
              />
            </div>

            {form.watch('acessoAposTermino') && (
              <div className="grid gap-2">
                <Label htmlFor="diasAcessoExtra">Dias de acesso extra</Label>
                <Input
                  id="diasAcessoExtra"
                  type="number"
                  min={0}
                  placeholder="30"
                  {...form.register('diasAcessoExtra', { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Turma'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
