'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Option, ModuloOption } from '../types'

interface ContextSelectorProps {
    cursos: Option[]
    disciplinas: Option[]
    frentes: Option[]
    modulos: ModuloOption[]
    atividades: Option[]

    cursoId: string
    disciplinaId: string
    frenteId: string
    moduloId: string
    atividadeId: string

    onCursoChange: (id: string) => void
    onDisciplinaChange: (id: string) => void
    onFrenteChange: (id: string) => void
    onModuloChange: (id: string) => void
    onAtividadeChange: (id: string) => void

    loadingCursos: boolean
    loadingDisciplinas: boolean
    loadingFrentes: boolean
    loadingModulos: boolean
    loadingAtividades: boolean
}

export function ContextSelector({
    cursos,
    disciplinas,
    frentes,
    modulos,
    atividades,
    cursoId,
    disciplinaId,
    frenteId,
    moduloId,
    atividadeId,
    onCursoChange,
    onDisciplinaChange,
    onFrenteChange,
    onModuloChange,
    onAtividadeChange,
    loadingCursos,
    loadingFrentes,
    loadingModulos,
    loadingAtividades
}: ContextSelectorProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Contexto</CardTitle>
                <CardDescription>Selecione disciplina/frente ou use os parâmetros da URL.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Curso */}
                    <div className="space-y-2">
                        <Label htmlFor="curso">Curso</Label>
                        <Select
                            value={cursoId || undefined}
                            onValueChange={onCursoChange}
                            disabled={loadingCursos}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={loadingCursos ? 'Carregando...' : 'Selecione'} />
                            </SelectTrigger>
                            <SelectContent>
                                {cursos.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Disciplina */}
                    <div className="space-y-2">
                        <Label htmlFor="disciplina">Disciplina *</Label>
                        <Select
                            value={disciplinaId || undefined}
                            onValueChange={onDisciplinaChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                {disciplinas.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                        {d.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Frente */}
                    <div className="space-y-2">
                        <Label htmlFor="frente">Frente</Label>
                        <Select
                            value={frenteId || undefined}
                            onValueChange={onFrenteChange}
                            disabled={!disciplinaId || loadingFrentes}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={loadingFrentes ? 'Carregando...' : 'Selecione'} />
                            </SelectTrigger>
                            <SelectContent>
                                {frentes.length === 0 && <SelectItem value="none" disabled>Nenhuma frente</SelectItem>}
                                {frentes.map((f) => (
                                    <SelectItem key={f.id} value={f.id}>
                                        {f.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Módulo */}
                    <div className="space-y-2">
                        <Label htmlFor="modulo">Módulo</Label>
                        <Select
                            value={moduloId || undefined}
                            onValueChange={onModuloChange}
                            disabled={!frenteId || loadingModulos}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={loadingModulos ? 'Carregando...' : 'Selecione'} />
                            </SelectTrigger>
                            <SelectContent>
                                {modulos.length === 0 && <SelectItem value="none" disabled>Nenhum módulo</SelectItem>}
                                {modulos.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.numero_modulo ? `${m.numero_modulo} - ` : ''}{m.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Atividade */}
                    <div className="space-y-2">
                        <Label htmlFor="atividade">Atividade (Opcional)</Label>
                        <Select
                            value={atividadeId || undefined}
                            onValueChange={onAtividadeChange}
                            disabled={!moduloId || loadingAtividades}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={loadingAtividades ? 'Carregando...' : 'Selecione'} />
                            </SelectTrigger>
                            <SelectContent>
                                {atividades.length === 0 && <SelectItem value="none" disabled>Nenhuma atividade</SelectItem>}
                                {atividades.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[0.8rem] text-muted-foreground">
                            Vincular a uma atividade permite marcar como concluída ao final.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
