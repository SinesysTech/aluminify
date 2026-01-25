'use client'

import * as React from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/shared/library/utils'
import type { DificuldadePercebida } from '@/app/shared/core/services/progresso-atividade'
import type { AtividadeComProgresso } from '../types'

interface DesempenhoData {
  questoesTotais: number
  questoesAcertos: number
  dificuldadePercebida: DificuldadePercebida
  anotacoesPessoais?: string | null
}

interface RegistrarDesempenhoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  atividade: AtividadeComProgresso
  onSave: (data: DesempenhoData) => Promise<void>
}

export function RegistrarDesempenhoModal({
  open,
  onOpenChange,
  atividade,
  onSave,
}: RegistrarDesempenhoModalProps) {
  const [questoesTotais, setQuestoesTotais] = React.useState<string>('')
  const [questoesAcertos, setQuestoesAcertos] = React.useState<string>('')
  const [dificuldadePercebida, setDificuldadePercebida] = React.useState<DificuldadePercebida | ''>('')
  const [anotacoesPessoais, setAnotacoesPessoais] = React.useState<string>('')
  const [isSaving, setIsSaving] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Resetar campos quando modal abrir
  React.useEffect(() => {
    if (open) {
      setQuestoesTotais('')
      setQuestoesAcertos('')
      setDificuldadePercebida('')
      setAnotacoesPessoais('')
      setErrors({})
    }
  }, [open])

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar questões totais
    const total = parseInt(questoesTotais, 10)
    if (!questoesTotais || questoesTotais.trim() === '') {
      newErrors.questoesTotais = 'Questões totais é obrigatório'
    } else if (isNaN(total) || total < 1) {
      newErrors.questoesTotais = 'Questões totais deve ser pelo menos 1'
    }

    // Validar questões acertadas
    const acertos = parseInt(questoesAcertos, 10)
    if (!questoesAcertos || questoesAcertos.trim() === '') {
      newErrors.questoesAcertos = 'Questões acertadas é obrigatório'
    } else if (isNaN(acertos) || acertos < 0) {
      newErrors.questoesAcertos = 'Questões acertadas não pode ser negativo'
    } else if (!isNaN(total) && acertos > total) {
      newErrors.questoesAcertos = `Questões acertadas não pode ser maior que questões totais (${total})`
    }

    // Validar dificuldade
    if (!dificuldadePercebida) {
      newErrors.dificuldadePercebida = 'Dificuldade percebida é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validarFormulario()) {
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        questoesTotais: parseInt(questoesTotais, 10),
        questoesAcertos: parseInt(questoesAcertos, 10),
        dificuldadePercebida: dificuldadePercebida as DificuldadePercebida,
        anotacoesPessoais: anotacoesPessoais.trim() || null,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar desempenho:', error)
      setErrors({
        geral: error instanceof Error ? error.message : 'Erro ao salvar desempenho. Tente novamente.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const questoesTotaisNum = parseInt(questoesTotais, 10)
  const questoesAcertosNum = parseInt(questoesAcertos, 10)
  const isFormValid =
    questoesTotaisNum >= 1 &&
    questoesAcertosNum >= 0 &&
    !isNaN(questoesTotaisNum) &&
    !isNaN(questoesAcertosNum) &&
    questoesAcertosNum <= questoesTotaisNum &&
    !!dificuldadePercebida

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Desempenho</DialogTitle>
          <DialogDescription>
            Registre seu desempenho na atividade: <strong>{atividade.titulo}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {errors.geral && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errors.geral}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="questoes-totais">
              Questões Totais <span className="text-destructive">*</span>
            </Label>
            <Input
              id="questoes-totais"
              type="number"
              min="1"
              placeholder="Ex: 10"
              value={questoesTotais}
              onChange={(e) => {
                setQuestoesTotais(e.target.value)
                if (errors.questoesTotais) {
                  setErrors((prev) => ({ ...prev, questoesTotais: '' }))
                }
              }}
              className={cn(errors.questoesTotais && 'border-destructive')}
            />
            {errors.questoesTotais && (
              <p className="text-xs text-destructive">{errors.questoesTotais}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="questoes-acertos">
              Questões Acertadas <span className="text-destructive">*</span>
            </Label>
            <Input
              id="questoes-acertos"
              type="number"
              min="0"
              max={!isNaN(questoesTotaisNum) ? questoesTotaisNum : undefined}
              placeholder="Ex: 8"
              value={questoesAcertos}
              onChange={(e) => {
                setQuestoesAcertos(e.target.value)
                if (errors.questoesAcertos) {
                  setErrors((prev) => ({ ...prev, questoesAcertos: '' }))
                }
              }}
              className={cn(errors.questoesAcertos && 'border-destructive')}
            />
            {errors.questoesAcertos && (
              <p className="text-xs text-destructive">{errors.questoesAcertos}</p>
            )}
            {!errors.questoesAcertos &&
              !isNaN(questoesTotaisNum) &&
              !isNaN(questoesAcertosNum) &&
              questoesAcertosNum <= questoesTotaisNum && (
                <p className="text-xs text-muted-foreground">
                  Taxa de acerto: {questoesTotaisNum > 0 ? Math.round((questoesAcertosNum / questoesTotaisNum) * 100) : 0}%
                </p>
              )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dificuldade">
              Dificuldade Percebida <span className="text-destructive">*</span>
            </Label>
            <Select
              value={dificuldadePercebida}
              onValueChange={(value) => {
                setDificuldadePercebida(value as DificuldadePercebida)
                if (errors.dificuldadePercebida) {
                  setErrors((prev) => ({ ...prev, dificuldadePercebida: '' }))
                }
              }}
            >
              <SelectTrigger
                id="dificuldade"
                className={cn(errors.dificuldadePercebida && 'border-destructive')}
              >
                <SelectValue placeholder="Selecione a dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Muito Facil">Muito Fácil</SelectItem>
                <SelectItem value="Facil">Fácil</SelectItem>
                <SelectItem value="Medio">Médio</SelectItem>
                <SelectItem value="Dificil">Difícil</SelectItem>
                <SelectItem value="Muito Dificil">Muito Difícil</SelectItem>
              </SelectContent>
            </Select>
            {errors.dificuldadePercebida && (
              <p className="text-xs text-destructive">{errors.dificuldadePercebida}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="anotacoes">Anotações Pessoais (opcional)</Label>
            <Textarea
              id="anotacoes"
              placeholder="Ex: Preciso revisar a teoria sobre..."
              value={anotacoesPessoais}
              onChange={(e) => setAnotacoesPessoais(e.target.value)}
              rows={3}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {anotacoesPessoais.length}/1000 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={!isFormValid || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar e Concluir'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



