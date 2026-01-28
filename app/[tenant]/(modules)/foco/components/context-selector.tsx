'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/app/shared/components/forms/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/shared/components/forms/select'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, BookOpen, Layers, FolderOpen, FileText, Sparkles } from 'lucide-react'
import { Option, ModuloOption } from '../types'
import { cn } from '@/lib/utils'

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

    lastContext?: {
        cursoId?: string
        disciplinaId?: string
        cursoNome?: string
        disciplinaNome?: string
    } | null
    onQuickStart?: () => void
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
    loadingDisciplinas,
    loadingFrentes,
    loadingModulos,
    loadingAtividades,
    lastContext,
    onQuickStart
}: ContextSelectorProps) {
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Get selected names for display
    const selectedCurso = useMemo(() =>
        cursos.find(c => c.id === cursoId)?.nome || '',
        [cursos, cursoId]
    )
    const selectedDisciplina = useMemo(() =>
        disciplinas.find(d => d.id === disciplinaId)?.nome || '',
        [disciplinas, disciplinaId]
    )

    // Check if we have a valid last context to show quick start
    const hasValidLastContext = lastContext?.disciplinaId && lastContext?.disciplinaNome

    // Calculate selection depth for progressive disclosure
    const selectionDepth = useMemo(() => {
        if (atividadeId) return 5
        if (moduloId) return 4
        if (frenteId) return 3
        if (disciplinaId) return 2
        if (cursoId) return 1
        return 0
    }, [cursoId, disciplinaId, frenteId, moduloId, atividadeId])

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">O que você vai estudar?</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Selecione a disciplina para começar
                            </p>
                        </div>
                    </div>

                    {/* Selection summary badge */}
                    {disciplinaId && (
                        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                            {selectedCurso && <span>{selectedCurso}</span>}
                            {selectedCurso && selectedDisciplina && <span>/</span>}
                            {selectedDisciplina && <span className="font-medium text-foreground">{selectedDisciplina}</span>}
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                {/* Quick Start Option */}
                {hasValidLastContext && !disciplinaId && (
                    <div className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium">Continuar onde parou</p>
                                    <p className="text-sm text-muted-foreground">
                                        {lastContext?.cursoNome && `${lastContext.cursoNome} · `}
                                        {lastContext?.disciplinaNome}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={onQuickStart}
                                className="shrink-0"
                            >
                                Usar este contexto
                            </Button>
                        </div>
                    </div>
                )}

                {/* Primary selections - always visible */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Curso */}
                    <div className="space-y-2">
                        <Label htmlFor="curso" className="flex items-center gap-2 text-sm">
                            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                            Curso
                        </Label>
                        <Select
                            value={cursoId || undefined}
                            onValueChange={onCursoChange}
                            disabled={loadingCursos}
                        >
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder={loadingCursos ? 'Carregando...' : 'Selecione o curso'} />
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

                    {/* Disciplina - Required */}
                    <div className="space-y-2">
                        <Label htmlFor="disciplina" className="flex items-center gap-2 text-sm">
                            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            Disciplina
                            <span className="text-xs text-primary font-normal">(obrigatório)</span>
                        </Label>
                        <Select
                            value={disciplinaId || undefined}
                            onValueChange={onDisciplinaChange}
                            disabled={loadingDisciplinas}
                        >
                            <SelectTrigger className={cn(
                                "h-11",
                                !disciplinaId && "border-primary/50 ring-1 ring-primary/20"
                            )}>
                                <SelectValue placeholder={loadingDisciplinas ? 'Carregando...' : 'Selecione a disciplina'} />
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
                </div>

                {/* Advanced Options - Progressive Disclosure */}
                {disciplinaId && cursoId && (
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-between py-2 px-1 rounded-md hover:bg-muted/50 cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <FolderOpen className="h-4 w-4" />
                                Especificar frente, módulo ou atividade
                                {(frenteId || moduloId || atividadeId) && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        {selectionDepth - 2} selecionado(s)
                                    </span>
                                )}
                            </span>
                            {showAdvanced ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </button>

                        {showAdvanced && (
                            <div className="mt-4 space-y-4 pl-4 border-l-2 border-muted">
                                {/* Frente */}
                                <div className="space-y-2">
                                    <Label htmlFor="frente" className="flex items-center gap-2 text-sm">
                                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                        Frente
                                    </Label>
                                    <Select
                                        value={frenteId || undefined}
                                        onValueChange={onFrenteChange}
                                        disabled={!disciplinaId || loadingFrentes}
                                    >
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder={
                                                loadingFrentes ? 'Carregando...' :
                                                frentes.length === 0 ? 'Nenhuma frente disponível' :
                                                'Selecione a frente'
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {frentes.map((f) => (
                                                <SelectItem key={f.id} value={f.id}>
                                                    {f.nome}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Módulo - only show if frente selected */}
                                {frenteId && (
                                    <div className="space-y-2">
                                        <Label htmlFor="modulo" className="flex items-center gap-2 text-sm">
                                            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                            Módulo
                                        </Label>
                                        <Select
                                            value={moduloId || undefined}
                                            onValueChange={onModuloChange}
                                            disabled={loadingModulos}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder={
                                                    loadingModulos ? 'Carregando...' :
                                                    modulos.length === 0 ? 'Nenhum módulo disponível' :
                                                    'Selecione o módulo'
                                                } />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {modulos.map((m) => (
                                                    <SelectItem key={m.id} value={m.id}>
                                                        {m.numero_modulo ? `${m.numero_modulo} - ` : ''}{m.nome}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Atividade - only show if módulo selected */}
                                {moduloId && (
                                    <div className="space-y-2">
                                        <Label htmlFor="atividade" className="flex items-center gap-2 text-sm">
                                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                            Atividade
                                            <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                                        </Label>
                                        <Select
                                            value={atividadeId || undefined}
                                            onValueChange={onAtividadeChange}
                                            disabled={loadingAtividades}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder={
                                                    loadingAtividades ? 'Carregando...' :
                                                    atividades.length === 0 ? 'Nenhuma atividade disponível' :
                                                    'Selecione a atividade'
                                                } />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {atividades.map((a) => (
                                                    <SelectItem key={a.id} value={a.id}>
                                                        {a.nome}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Vincular permite marcar como concluída ao final da sessão.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
