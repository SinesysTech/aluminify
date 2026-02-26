'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
        <Card className="overflow-hidden border-border/60">
            <CardContent className="p-5 md:p-6 space-y-5">
                {/* Section header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <BookOpen className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold tracking-tight">O que você vai estudar?</h2>
                            {disciplinaId && (
                                <p className="text-xs text-muted-foreground mt-0.5">{selectedDisciplina}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Start Option */}
                {hasValidLastContext && !disciplinaId && (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium">Continuar onde parou</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {lastContext?.cursoNome && `${lastContext.cursoNome} · `}
                                    {lastContext?.disciplinaNome}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onQuickStart}
                            className="shrink-0 h-8 text-xs"
                        >
                            Usar
                        </Button>
                    </div>
                )}

                {/* Primary selections - always visible */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Curso */}
                    <div className="space-y-1.5">
                        <Label htmlFor="curso" className="flex items-center gap-1.5 text-xs font-medium">
                            <Layers className="h-3 w-3 text-muted-foreground" />
                            Curso
                        </Label>
                        <Select
                            value={cursoId}
                            onValueChange={onCursoChange}
                            disabled={loadingCursos}
                        >
                            <SelectTrigger size="sm">
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
                    <div className="space-y-1.5">
                        <Label htmlFor="disciplina" className="flex items-center gap-1.5 text-xs font-medium">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                            Disciplina
                            <span className="text-[10px] text-primary font-normal">(obrigatório)</span>
                        </Label>
                        <Select
                            value={disciplinaId}
                            onValueChange={onDisciplinaChange}
                            disabled={loadingDisciplinas}
                        >
                            <SelectTrigger size="sm" className={cn(
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
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-between py-2 px-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        >
                            <span className="flex items-center gap-1.5">
                                <FolderOpen className="h-3.5 w-3.5" />
                                Especificar frente, módulo ou atividade
                                {(frenteId || moduloId || atividadeId) && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                        {selectionDepth - 2}
                                    </span>
                                )}
                            </span>
                            {showAdvanced ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                            )}
                        </button>

                        {showAdvanced && (
                            <div className="mt-3 space-y-3 pl-4 border-l-2 border-muted">
                                {/* Frente */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="frente" className="flex items-center gap-1.5 text-xs font-medium">
                                        <FolderOpen className="h-3 w-3 text-muted-foreground" />
                                        Frente
                                    </Label>
                                    <Select
                                        value={frenteId}
                                        onValueChange={onFrenteChange}
                                        disabled={!disciplinaId || loadingFrentes}
                                    >
                                        <SelectTrigger size="sm">
                                            <SelectValue placeholder={
                                                loadingFrentes ? 'Carregando...' :
                                                    frentes.length === 0 ? 'Nenhuma frente' :
                                                        'Selecione'
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
                                    <div className="space-y-1.5">
                                        <Label htmlFor="modulo" className="flex items-center gap-1.5 text-xs font-medium">
                                            <Layers className="h-3 w-3 text-muted-foreground" />
                                            Módulo
                                        </Label>
                                        <Select
                                            value={moduloId}
                                            onValueChange={onModuloChange}
                                            disabled={loadingModulos}
                                        >
                                            <SelectTrigger size="sm">
                                                <SelectValue placeholder={
                                                    loadingModulos ? 'Carregando...' :
                                                        modulos.length === 0 ? 'Nenhum módulo' :
                                                            'Selecione'
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
                                    <div className="space-y-1.5">
                                        <Label htmlFor="atividade" className="flex items-center gap-1.5 text-xs font-medium">
                                            <FileText className="h-3 w-3 text-muted-foreground" />
                                            Atividade
                                            <span className="text-[10px] text-muted-foreground font-normal">(opcional)</span>
                                        </Label>
                                        <Select
                                            value={atividadeId}
                                            onValueChange={onAtividadeChange}
                                            disabled={loadingAtividades}
                                        >
                                            <SelectTrigger size="sm">
                                                <SelectValue placeholder={
                                                    loadingAtividades ? 'Carregando...' :
                                                        atividades.length === 0 ? 'Nenhuma atividade' :
                                                            'Selecione'
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
