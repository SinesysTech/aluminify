'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

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
}

interface SalaEstudosFiltersProps {
  cursos: Curso[]
  disciplinas: Disciplina[]
  frentes: Frente[]
  cursoSelecionado: string
  disciplinaSelecionada: string
  frenteSelecionada: string
  onCursoChange: (cursoId: string) => void
  onDisciplinaChange: (disciplinaId: string) => void
  onFrenteChange: (frenteId: string) => void
  isLoadingDisciplinas?: boolean
  isLoadingFrentes?: boolean
}

export function SalaEstudosFilters({
  cursos,
  disciplinas,
  frentes,
  cursoSelecionado,
  disciplinaSelecionada,
  frenteSelecionada,
  onCursoChange,
  onDisciplinaChange,
  onFrenteChange,
  isLoadingDisciplinas = false,
  isLoadingFrentes = false,
}: SalaEstudosFiltersProps) {
  const frentesFiltradas = React.useMemo(
    () => frentes.filter((f) => f.disciplina_id === disciplinaSelecionada),
    [frentes, disciplinaSelecionada],
  )

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="curso">Curso</Label>
          <Select value={cursoSelecionado} onValueChange={onCursoChange}>
            <SelectTrigger id="curso">
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
          <Label htmlFor="disciplina">Disciplina</Label>
          <Select
            value={disciplinaSelecionada}
            onValueChange={onDisciplinaChange}
            disabled={!cursoSelecionado || isLoadingDisciplinas}
          >
            <SelectTrigger id="disciplina">
              <SelectValue
                placeholder={
                  isLoadingDisciplinas
                    ? 'Carregando...'
                    : !cursoSelecionado
                      ? 'Selecione um curso primeiro'
                      : 'Selecione uma disciplina'
                }
              />
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
          <Label htmlFor="frente">Frente</Label>
          <Select
            value={frenteSelecionada}
            onValueChange={onFrenteChange}
            disabled={!disciplinaSelecionada || isLoadingFrentes}
          >
            <SelectTrigger id="frente">
              <SelectValue
                placeholder={
                  isLoadingFrentes
                    ? 'Carregando...'
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
      </div>
    </div>
  )
}

