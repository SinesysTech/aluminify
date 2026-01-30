'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/app/shared/components/forms/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/shared/components/forms/select'
import { Target } from 'lucide-react'
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Selecionar Flashcards
                </CardTitle>
                <CardDescription>
                    Escolha o curso, disciplina, frente e módulo para revisar flashcards específicos
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Curso */}
                    <div className="space-y-2">
                        <Label>Curso *</Label>
                        <Select
                            value={cursoSelecionado}
                            onValueChange={onCursoChange}
                            disabled={isLoadingFiltros || isLoadingCursos}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        isLoadingCursos
                                            ? 'Carregando cursos...'
                                            : cursos.length === 0
                                                ? 'Nenhum curso disponível'
                                                : 'Selecione um curso'
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
                    <div className="space-y-2">
                        <Label>Disciplina *</Label>
                        <Select
                            value={disciplinaSelecionada}
                            onValueChange={onDisciplinaChange}
                            disabled={!cursoSelecionado || isLoadingFiltros}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        isLoadingFiltros
                                            ? 'Carregando...'
                                            : !cursoSelecionado
                                                ? 'Selecione um curso primeiro'
                                                : 'Selecione uma disciplina'
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
                    <div className="space-y-2">
                        <Label>Frente *</Label>
                        <Select
                            value={frenteSelecionada}
                            onValueChange={onFrenteChange}
                            disabled={!disciplinaSelecionada || !cursoSelecionado || isLoadingFiltros}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        isLoadingFiltros
                                            ? 'Carregando...'
                                            : !disciplinaSelecionada
                                                ? 'Selecione uma disciplina primeiro'
                                                : 'Selecione uma frente'
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
                    <div className="space-y-2">
                        <Label>Módulo *</Label>
                        <Select
                            value={moduloSelecionado}
                            onValueChange={onModuloChange}
                            disabled={!frenteSelecionada || !cursoSelecionado || isLoadingFiltros}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        isLoadingFiltros
                                            ? 'Carregando...'
                                            : !frenteSelecionada
                                                ? 'Selecione uma frente primeiro'
                                                : 'Selecione um módulo'
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
