'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

// IDs estáveis para evitar erro de hidratação
const CURSO_SELECT_ID = 'curso-select-materials'
const DISCIPLINA_SELECT_ID = 'disciplina-select-materials'
const FRENTE_SELECT_ID = 'frente-select-materials'

type Curso = {
  id: string
  nome: string
}

type Disciplina = {
  id: string
  nome: string
}

type Frente = {
  id: string
  nome: string
  disciplina_id: string
  curso_id?: string | null
}

interface MaterialsFiltersProps {
  cursos: Curso[]
  disciplinas: Disciplina[]
  frentes: Frente[]
  cursoSelecionado: string
  disciplinaSelecionada: string
  frenteSelecionada: string
  onCursoChange: (cursoId: string) => void
  onDisciplinaChange: (disciplinaId: string) => void
  onFrenteChange: (frenteId: string) => void
  onGenerateStructure: () => void
  isGenerating?: boolean
  isLoadingFrentes?: boolean
}

export function MaterialsFilters({
  cursos,
  disciplinas,
  frentes,
  cursoSelecionado,
  disciplinaSelecionada,
  frenteSelecionada,
  onCursoChange,
  onDisciplinaChange,
  onFrenteChange,
  onGenerateStructure,
  isGenerating = false,
  isLoadingFrentes = false,
}: MaterialsFiltersProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const frentesFiltradas = React.useMemo(
    () => frentes.filter((f) => f.disciplina_id === disciplinaSelecionada),
    [frentes, disciplinaSelecionada],
  )

  const canGenerate = cursoSelecionado && disciplinaSelecionada && frenteSelecionada && !isGenerating

  // Renderizar placeholder durante SSR para evitar erro de hidratação
  if (!mounted) {
    return (
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor={CURSO_SELECT_ID}>Curso</Label>
            <div className="h-9 w-full rounded-md border bg-transparent" />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor={DISCIPLINA_SELECT_ID}>Disciplina</Label>
            <div className="h-9 w-full rounded-md border bg-transparent" />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor={FRENTE_SELECT_ID}>Frente</Label>
            <div className="h-9 w-full rounded-md border bg-transparent" />
          </div>
          <div className="flex-shrink-0">
            <Button disabled className="w-full md:w-auto">
              Gerar Estrutura
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor={CURSO_SELECT_ID}>Curso</Label>
          <Select value={cursoSelecionado} onValueChange={onCursoChange}>
            <SelectTrigger id={CURSO_SELECT_ID}>
              <SelectValue placeholder="Selecione um curso" />
            </SelectTrigger>
            <SelectContent>
              {cursos.map((curso) => (
                <SelectItem key={curso.id} value={curso.id}>
                  {curso.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label htmlFor={DISCIPLINA_SELECT_ID}>Disciplina</Label>
          <Select
            value={disciplinaSelecionada}
            onValueChange={onDisciplinaChange}
            disabled={!cursoSelecionado}
          >
            <SelectTrigger id={DISCIPLINA_SELECT_ID}>
              <SelectValue placeholder="Selecione uma disciplina" />
            </SelectTrigger>
            <SelectContent>
              {disciplinas.map((disciplina) => (
                <SelectItem key={disciplina.id} value={disciplina.id}>
                  {disciplina.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label htmlFor={FRENTE_SELECT_ID}>Frente</Label>
          <Select
            value={frenteSelecionada}
            onValueChange={onFrenteChange}
            disabled={!disciplinaSelecionada || isLoadingFrentes}
          >
            <SelectTrigger id={FRENTE_SELECT_ID}>
              <SelectValue
                placeholder={
                  isLoadingFrentes
                    ? 'Carregando...'
                    : !cursoSelecionado
                      ? 'Selecione um curso primeiro'
                      : !disciplinaSelecionada
                        ? 'Selecione uma disciplina primeiro'
                        : 'Selecione uma frente'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {frentesFiltradas.map((frente) => (
                <SelectItem key={frente.id} value={frente.id}>
                  {frente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-shrink-0">
          <Button
            onClick={onGenerateStructure}
            disabled={!canGenerate}
            className="w-full md:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar Estrutura'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

