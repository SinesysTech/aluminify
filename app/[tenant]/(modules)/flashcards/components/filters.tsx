'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/app/shared/components/forms/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/shared/components/forms/select'
import { Target, Layers, BookOpen, FolderOpen } from 'lucide-react'
import { Curso, Disciplina, Frente, Modulo } from '../types'

interface FiltersProps {
    cursos: Curso[]
    disciplinas: Disciplina[]
    frentes: Frente[]
    modulos: Modulo[]

    cursoSelecionado: string
    disciplinaSelecionada: string
    frenteSelecionada: string
    moduloSelecionado: string

    onCursoChange: (id: string) => void
    onDisciplinaChange: (id: string) => void
    onFrenteChange: (id: string) => void
    onModuloChange: (id: string) => void

    isLoadingCursos?: boolean
    isLoadingFiltros?: boolean
}

export function Filters({
    cursos,
    disciplinas,
    frentes,
    modulos,
    cursoSelecionado,
    disciplinaSelecionada,
    frenteSelecionada,
    moduloSelecionado,
    onCursoChange,
    onDisciplinaChange,
    onFrenteChange,
    onModuloChange,
    isLoadingCursos = false,
    isLoadingFiltros = false
}: FiltersProps) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4 md:p-5 space-y-4">
                {/* Section header */}
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Selecionar flashcards</h2>
                        <p className="text-xs text-muted-foreground">
                            Escolha o curso, disciplina, frente e módulo para revisar
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    {/* Curso */}
                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs font-medium">
                            <Layers className="h-3 w-3 text-muted-foreground" />
                            Curso
                            <span className="text-[10px] text-primary font-normal">(obrigatório)</span>
                        </Label>
                        <Select
                            value={cursoSelecionado}
                            onValueChange={onCursoChange}
                            disabled={isLoadingFiltros || isLoadingCursos}
                        >
                            <SelectTrigger size="sm">
                                <SelectValue
                                    placeholder={
                                        isLoadingCursos
                                            ? 'Carregando...'
                                            : cursos.length === 0
                                                ? 'Nenhum curso disponível'
                                                : 'Selecione o curso'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingCursos ? (
                                    <SelectItem value="loading" disabled>
                                        Carregando...
                                    </SelectItem>
                                ) : cursos.length === 0 ? (
                                    <SelectItem value="no-cursos" disabled>
                                        Nenhum curso disponível
                                    </SelectItem>
                                ) : (
                                    cursos.map((curso) => (
                                        <SelectItem key={curso.id} value={curso.id}>
                                            {curso.nome}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Disciplina */}
                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs font-medium">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                            Disciplina
                            <span className="text-[10px] text-primary font-normal">(obrigatório)</span>
                        </Label>
                        <Select
                            value={disciplinaSelecionada}
                            onValueChange={onDisciplinaChange}
                            disabled={!cursoSelecionado || isLoadingFiltros}
                        >
                            <SelectTrigger size="sm">
                                <SelectValue
                                    placeholder={
                                        isLoadingFiltros
                                            ? 'Carregando...'
                                            : !cursoSelecionado
                                                ? 'Selecione um curso primeiro'
                                                : 'Selecione a disciplina'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {disciplinas.length === 0 && cursoSelecionado ? (
                                    <SelectItem value="no-disciplinas" disabled>
                                        Nenhuma disciplina encontrada
                                    </SelectItem>
                                ) : (
                                    disciplinas.map((disciplina) => (
                                        <SelectItem key={disciplina.id} value={disciplina.id}>
                                            {disciplina.nome}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Frente */}
                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs font-medium">
                            <FolderOpen className="h-3 w-3 text-muted-foreground" />
                            Frente
                            <span className="text-[10px] text-primary font-normal">(obrigatório)</span>
                        </Label>
                        <Select
                            value={frenteSelecionada}
                            onValueChange={onFrenteChange}
                            disabled={!disciplinaSelecionada || !cursoSelecionado || isLoadingFiltros}
                        >
                            <SelectTrigger size="sm">
                                <SelectValue
                                    placeholder={
                                        isLoadingFiltros
                                            ? 'Carregando...'
                                            : !disciplinaSelecionada
                                                ? 'Selecione uma disciplina primeiro'
                                                : 'Selecione a frente'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {frentes.length === 0 && disciplinaSelecionada ? (
                                    <SelectItem value="no-frentes" disabled>
                                        Nenhuma frente encontrada
                                    </SelectItem>
                                ) : (
                                    frentes.map((frente) => (
                                        <SelectItem key={frente.id} value={frente.id}>
                                            {frente.nome}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Módulo */}
                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs font-medium">
                            <Layers className="h-3 w-3 text-muted-foreground" />
                            Módulo
                            <span className="text-[10px] text-primary font-normal">(obrigatório)</span>
                        </Label>
                        <Select
                            value={moduloSelecionado}
                            onValueChange={onModuloChange}
                            disabled={!frenteSelecionada || !cursoSelecionado || isLoadingFiltros}
                        >
                            <SelectTrigger size="sm">
                                <SelectValue
                                    placeholder={
                                        isLoadingFiltros
                                            ? 'Carregando...'
                                            : !frenteSelecionada
                                                ? 'Selecione uma frente primeiro'
                                                : 'Selecione o módulo'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {modulos.length === 0 && frenteSelecionada ? (
                                    <SelectItem value="no-modulos" disabled>
                                        Nenhum módulo encontrado
                                    </SelectItem>
                                ) : (
                                    modulos.map((modulo) => (
                                        <SelectItem key={modulo.id} value={modulo.id}>
                                            {modulo.numero_modulo ? `${modulo.numero_modulo} - ` : ''}
                                            {modulo.nome}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
